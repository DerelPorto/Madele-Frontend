'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, InputNumber } from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage } from '@/lib/utils';
import type { Cliente } from '@/lib/types';

const clienteSchema = z.object({
  codigo_cliente: z.string().min(2, 'El código debe tener al menos 2 caracteres').max(30),
  nombre_razon_social: z.string().min(2, 'El nombre o razón social es obligatorio').max(150),
  persona_contacto: z.string().max(150).optional().or(z.literal('')),
  documento_identidad: z.string().max(30).optional().or(z.literal('')),
  tipo_comprobante_defecto: z.string().max(20).optional().or(z.literal('')),
  correo: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
  telefono: z.string().max(30).optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  limite_credito: z.coerce.number().min(0, 'El límite no puede ser negativo').default(0),
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

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      codigo_cliente: '',
      nombre_razon_social: '',
      persona_contacto: '',
      documento_identidad: '',
      tipo_comprobante_defecto: 'B01',
      correo: '',
      telefono: '',
      direccion: '',
      limite_credito: 0,
    },
  });

  useEffect(() => {
    if (clienteToEdit) {
      reset({
        codigo_cliente: clienteToEdit.codigo_cliente,
        nombre_razon_social: clienteToEdit.nombre_razon_social,
        persona_contacto: clienteToEdit.persona_contacto || '',
        documento_identidad: clienteToEdit.documento_identidad || '',
        tipo_comprobante_defecto: clienteToEdit.tipo_comprobante_defecto || 'B01',
        correo: clienteToEdit.correo || '',
        telefono: clienteToEdit.telefono || '',
        direccion: clienteToEdit.direccion || '',
        limite_credito: Number(clienteToEdit.limite_credito) || 0,
      });
    } else {
      reset({
        codigo_cliente: '',
        nombre_razon_social: '',
        persona_contacto: '',
        documento_identidad: '',
        tipo_comprobante_defecto: 'B01',
        correo: '',
        telefono: '',
        direccion: '',
        limite_credito: 0,
      });
    }
  }, [clienteToEdit, reset, isOpen]);

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      const payload = {
        codigo_cliente: data.codigo_cliente.trim(),
        nombre_razon_social: data.nombre_razon_social.trim(),
        persona_contacto: data.persona_contacto?.trim() || undefined,
        documento_identidad: data.documento_identidad?.trim() || undefined,
        tipo_comprobante_defecto: data.tipo_comprobante_defecto?.trim() || undefined,
        correo: data.correo?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        limite_credito: data.limite_credito,
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
      toast.error(extractErrorMessage(err), 'Error al guardar cliente');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clienteToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      subtitle="Complete los datos comerciales y de contacto del cliente"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Codigo & Razón Social */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Código Cliente *
            </label>
            <Controller
              name="codigo_cliente"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Código de cliente"
                  status={errors.codigo_cliente ? 'error' : ''}
                  className="font-mono uppercase font-bold"
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
                  className="font-semibold"
                />
              )}
            />
            {errors.nombre_razon_social && (
              <p className="text-[11px] text-red-600 mt-0.5">{errors.nombre_razon_social.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Persona de Contacto Destacada */}
        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
          <label className="block text-xs font-extrabold text-amber-950 mb-1.5 flex items-center gap-1.5">
            <UserOutlined className="text-amber-600" />
            Persona de Contacto
          </label>
          <Controller
            name="persona_contacto"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nombre del contacto o administrador"
                className="bg-white font-semibold"
              />
            )}
          />
          <p className="text-[11px] text-amber-800/80 mt-1">
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
                  options={[
                    { value: 'B01', label: 'B01 - Crédito Fiscal' },
                    { value: 'B02', label: 'B02 - Consumidor Final' },
                    { value: 'B14', label: 'B14 - Régimen Especial' },
                    { value: 'B15', label: 'B15 - Gubernamental' },
                  ]}
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

        {/* Row 6: Límite de Crédito */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <DollarOutlined className="text-slate-500" />
            Límite de Crédito (DOP)
          </label>
          <Controller
            name="limite_credito"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                className="w-full font-mono font-bold"
                prefix="RD$"
                step={1000}
                min={0}
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
