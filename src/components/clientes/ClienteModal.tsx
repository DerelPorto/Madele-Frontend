'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  SearchOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useSiguienteCodigoCliente } from '@/services/clientMainService';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage } from '@/lib/utils';
import type { Cliente, ConsultaRncResponse } from '@/lib/types';
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
    clearErrors,
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

  const [isSearchingRnc, setIsSearchingRnc] = useState(false);
  const [dgiiInfo, setDgiiInfo] = useState<ConsultaRncResponse | null>(null);
  const lastQueriedRncRef = useRef<string>('');

  const handleConsultarDgii = async (rncOverride?: string, silent = false) => {
    const rawRnc = rncOverride ?? watch('documento_identidad') ?? '';
    const cleanRnc = rawRnc.replace(/\D/g, '').trim();

    if (!cleanRnc) {
      if (!silent) {
        toast.error('Por favor ingrese un número de RNC o Cédula para consultar en la DGII.');
      }
      return;
    }

    if (cleanRnc.length !== 9 && cleanRnc.length !== 11) {
      if (!silent) {
        toast.info('El RNC debe tener 9 dígitos o la Cédula 11 dígitos.');
      }
      return;
    }

    try {
      setIsSearchingRnc(true);
      const res = await api.consultarRnc(cleanRnc);

      if (res && res.encontrado) {
        setDgiiInfo(res);
        lastQueriedRncRef.current = cleanRnc;
        setValue('documento_identidad', cleanRnc);

        if (res.razon_social) {
          setValue('nombre_razon_social', res.razon_social, { shouldValidate: true });
          clearErrors('nombre_razon_social');
        }

        if (res.tipo_comprobante_sugerido) {
          setValue('tipo_comprobante_defecto', res.tipo_comprobante_sugerido);
        }

        toast.success(`Datos DGII obtenidos: ${res.razon_social || cleanRnc}`);
      } else {
        setDgiiInfo(null);
        if (!silent) {
          toast.info(res?.mensaje || 'No se encontraron datos en la DGII para este RNC/Cédula.');
        }
      }
    } catch (err: any) {
      setDgiiInfo(null);
      if (!silent) {
        toast.error(extractErrorMessage(err) || 'Error al conectar con la consulta de DGII.');
      }
    } finally {
      setIsSearchingRnc(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDgiiInfo(null);
      lastQueriedRncRef.current = '';
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
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Codigo & Razón Social */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="h-5 flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
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
                  size="large"
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
            <div className="h-5 flex items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BankOutlined className="text-[#0066B3]" />
                Nombre o Razón Social *
              </label>
            </div>
            <Controller
              name="nombre_razon_social"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
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
        <div className="p-3.5 bg-sky-50/60 border border-sky-200">
          <div className="h-5 flex items-center mb-1.5">
            <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <UserOutlined className="text-[#0066B3]" />
              Persona de Contacto
            </label>
          </div>
          <Controller
            name="persona_contacto"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                size="large"
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
            <div className="h-5 flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <IdcardOutlined className="text-[#0066B3]" />
                RNC / Cédula (DGII)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">9 u 11 dígitos</span>
            </div>
            <Controller
              name="documento_identidad"
              control={control}
              render={({ field }) => (
                <div className="flex gap-1.5">
                  <Input
                    {...field}
                    size="large"
                    placeholder="Ej. 05700046666 ó 101001577"
                    className="font-mono font-semibold"
                    onPressEnter={(e) => {
                      e.preventDefault();
                      handleConsultarDgii(field.value, false);
                    }}
                    onBlur={(e) => {
                      field.onBlur();
                      const clean = (e.target.value || '').replace(/\D/g, '').trim();
                      if (
                        (clean.length === 9 || clean.length === 11) &&
                        clean !== lastQueriedRncRef.current
                      ) {
                        handleConsultarDgii(clean, true);
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                      const clean = val.replace(/\D/g, '').trim();
                      if (dgiiInfo && clean !== dgiiInfo.rnc) {
                        setDgiiInfo(null);
                      }
                      // Auto-consultar al completar 9 u 11 dígitos
                      if (
                        (clean.length === 9 || clean.length === 11) &&
                        clean !== lastQueriedRncRef.current
                      ) {
                        handleConsultarDgii(clean, true);
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<SearchOutlined />}
                    loading={isSearchingRnc}
                    onClick={() => handleConsultarDgii(field.value, false)}
                    className="bg-[#0066B3] hover:bg-[#004E8A] font-semibold text-xs px-3"
                    title="Consultar y autocompletar desde DGII"
                  >
                    DGII
                  </Button>
                </div>
              )}
            />

            {/* Banner informativo de DGII si se encontraron datos */}
            {dgiiInfo && (
              <div
                className={`mt-2 p-2.5 border text-xs ${
                  dgiiInfo.estado === 'ACTIVO'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {dgiiInfo.estado === 'ACTIVO' ? (
                      <CheckCircleFilled className="text-emerald-600" />
                    ) : (
                      <ExclamationCircleFilled className="text-amber-600" />
                    )}
                    DGII: {dgiiInfo.estado || 'ACTIVO'}
                  </span>
                  {dgiiInfo.regimen_pago && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] uppercase font-semibold ${
                        dgiiInfo.estado === 'ACTIVO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dgiiInfo.regimen_pago}
                    </span>
                  )}
                </div>
                {dgiiInfo.actividad_economica && (
                  <p className="text-[11px] mt-1 leading-snug line-clamp-2">
                    <span className="font-semibold">Actividad:</span> {dgiiInfo.actividad_economica}
                  </p>
                )}
                {dgiiInfo.fuente && (
                  <p className="text-[10px] opacity-75 mt-1 italic">
                    Fuente: {dgiiInfo.fuente}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="h-5 flex items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Comprobante DGII por Defecto
              </label>
            </div>
            <Controller
              name="tipo_comprobante_defecto"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  size="large"
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
            {dgiiInfo?.tipo_comprobante_sugerido && (
              <p className="text-[11px] text-[#0066B3] font-semibold mt-1">
                Sugerido según DGII: {dgiiInfo.tipo_comprobante_sugerido}
              </p>
            )}
          </div>
        </div>

        {/* Row 4: Teléfono & Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="h-5 flex items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PhoneOutlined className="text-slate-500" />
                Teléfono
              </label>
            </div>
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <Input {...field} size="large" placeholder="Teléfono de contacto" />
              )}
            />
          </div>

          <div>
            <div className="h-5 flex items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MailOutlined className="text-slate-500" />
                Correo Electrónico
              </label>
            </div>
            <Controller
              name="correo"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
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
          <div className="h-5 flex items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <EnvironmentOutlined className="text-slate-500" />
              Dirección / Ubicación
            </label>
          </div>
          <Controller
            name="direccion"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder="Dirección fiscal o de entrega"
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
