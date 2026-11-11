'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useSiguienteCodigoCliente } from '@/services/clientMainService';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage } from '@/lib/utils';
import type { Cliente } from '@/lib/types';
import { COMPROBANTES_SELECT_OPTIONS } from '@/constants/comprobantes';
import { showErrorAlert } from '@/lib/swal';

const clienteSchema = z.object({
  codigo_cliente: z.string().optional().or(z.literal('')),
  nombre_razon_social: z.string().min(1, 'El nombre o razón social es obligatorio').max(150),
  persona_contacto: z.string().max(150).optional().or(z.literal('')),
  documento_identidad: z.string().max(30).optional().or(z.literal('')),
  tipo_comprobante_defecto: z.string().max(20).optional().or(z.literal('')),
  correo: z.string().optional().or(z.literal('')),
  telefono: z.string().max(30).optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteToEdit?: Cliente | null;
  onSuccess: (cliente: Cliente) => void;
}

export function ClienteModal({
  isOpen,
  onClose,
  clienteToEdit,
  onSuccess,
}: ClienteModalProps) {
  const toast = useToast();
  const { data: secuenciaCodigo, refetch: refetchSecuencia } = useSiguienteCodigoCliente();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      codigo_cliente: '',
      nombre_razon_social: '',
      persona_contacto: '',
      documento_identidad: '',
      tipo_comprobante_defecto: 'E31',
      correo: '',
      telefono: '',
      direccion: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (clienteToEdit) {
        reset({
          codigo_cliente: clienteToEdit.codigo_cliente,
          nombre_razon_social: clienteToEdit.nombre_razon_social,
          persona_contacto: clienteToEdit.persona_contacto || '',
          documento_identidad: clienteToEdit.documento_identidad || '',
          tipo_comprobante_defecto: clienteToEdit.tipo_comprobante_defecto || 'E31',
          correo: clienteToEdit.correo || '',
          telefono: clienteToEdit.telefono || '',
          direccion: clienteToEdit.direccion || '',
        });
      } else {
        refetchSecuencia();
        reset({
          codigo_cliente: secuenciaCodigo?.siguiente || '',
          nombre_razon_social: '',
          persona_contacto: '',
          documento_identidad: '',
          tipo_comprobante_defecto: 'E31',
          correo: '',
          telefono: '',
          direccion: '',
        });
      }
    }
  }, [clienteToEdit, reset, isOpen, refetchSecuencia, secuenciaCodigo?.siguiente]);

  // Sincronizar código automático si llega luego de abrir
  useEffect(() => {
    if (isOpen && !clienteToEdit && secuenciaCodigo?.siguiente && !watch('codigo_cliente')) {
      setValue('codigo_cliente', secuenciaCodigo.siguiente);
    }
  }, [isOpen, clienteToEdit, secuenciaCodigo?.siguiente, setValue, watch]);

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      const payload: any = {
        codigo_cliente: data.codigo_cliente?.trim() || undefined,
        nombre_razon_social: data.nombre_razon_social.trim(),
        persona_contacto: data.persona_contacto?.trim() || undefined,
        documento_identidad: data.documento_identidad?.trim() || undefined,
        tipo_comprobante_defecto: data.tipo_comprobante_defecto?.trim() || undefined,
        correo: data.correo?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        limite_credito: 0,
      };

      let result: Cliente;
      if (clienteToEdit) {
        result = await api.updateCliente(clienteToEdit.id, payload);
        toast.success(`Cliente "${result.nombre_razon_social}" actualizado correctamente.`);
      } else {
        result = await api.createCliente(payload);
        toast.success(`Cliente "${result.nombre_razon_social}" registrado exitosamente.`);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      await showErrorAlert(err, 'Error al guardar cliente');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clienteToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      subtitle="Complete los datos del cliente (solo el nombre es obligatorio)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Codigo & Razón Social */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Código Cliente
              </label>
              {!clienteToEdit && (
                <span className="text-[10px] text-[#0066B3] font-bold">
                  (Auto: {secuenciaCodigo?.siguiente || 'C-0001'})
                </span>
              )}
            </div>
            <Controller
              name="codigo_cliente"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={secuenciaCodigo?.siguiente || 'C-0001'}
                  status={errors.codigo_cliente ? 'error' : ''}
                  className="font-mono uppercase font-bold text-slate-900 bg-slate-50"
                />
              )}
            />
            {errors.codigo_cliente && (
              <p className="text-[11px] text-red-600 mt-0.5">{errors.codigo_cliente.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <BankOutlined className="text-[#0066B3]" />
              Nombre o Razón Social *
            </label>
            <Controller
              name="nombre_razon_social"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Nombre o razón social de la entidad"
                  status={errors.nombre_razon_social ? 'error' : ''}
                  className="font-semibold text-slate-900"
                />
              )}
            />
            {errors.nombre_razon_social && (
              <p className="text-[11px] text-red-600 mt-0.5">{errors.nombre_razon_social.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Persona de Contacto Destacada (Estilo Azul/Gris) */}
        <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-200">
          <label className="block text-xs font-extrabold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <UserOutlined className="text-[#0066B3]" />
            Persona de Contacto
          </label>
          <Controller
            name="persona_contacto"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nombre del contacto o administrador"
                className="bg-white font-semibold text-slate-900"
              />
            )}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Se mostrará de forma destacada en el encabezado oficial de las cotizaciones y facturas.
          </p>
        </div>

        {/* Row 3: Documento de Identidad & NCF por Defecto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <IdcardOutlined className="text-slate-500" />
              RNC / Cédula (Opcional)
            </label>
            <Controller
              name="documento_identidad"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="RNC o Cédula"
                  className="font-mono font-semibold"
                />
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Comprobante DGII por Defecto
            </label>
            <Controller
              name="tipo_comprobante_defecto"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  className="w-full"
                  showSearch
                  placeholder="Seleccione comprobante DGII"
                  filterOption={(input, option) => {
                    if (!input) return true;
                    const opt = option as any;
                    const label = String(opt?.label ?? '').toLowerCase();
                    const value = String(opt?.value ?? '').toLowerCase();
                    const search = input.toLowerCase();
                    return label.includes(search) || value.includes(search);
                  }}
                  options={COMPROBANTES_SELECT_OPTIONS}
                />
              )}
            />
          </div>
        </div>

        {/* Row 4: Teléfono & Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <PhoneOutlined className="text-slate-500" />
              Teléfono
            </label>
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Teléfono de contacto" />
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MailOutlined className="text-slate-500" />
              Correo Electrónico
            </label>
            <Controller
              name="correo"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="correo@cliente.com"
                  status={errors.correo ? 'error' : ''}
                />
              )}
            />
            {errors.correo && (
              <p className="text-[11px] text-red-600 mt-0.5">{errors.correo.message}</p>
            )}
          </div>
        </div>

        {/* Row 5: Dirección */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <EnvironmentOutlined className="text-slate-500" />
            Dirección / Ubicación
          </label>
          <Controller
            name="direccion"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Dirección o ubicación física"
              />
            )}
          />
        </div>

        {/* Footer Actions with Antd Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button onClick={onClose} icon={<CloseOutlined />}>
            Cancelar
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            icon={<SaveOutlined />}
            className="bg-[#0066B3] hover:bg-[#004E8A]"
          >
            {clienteToEdit ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
