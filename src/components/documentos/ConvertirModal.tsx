'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from 'antd';
import {
  ArrowRightOutlined,
  CloseOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useSiguienteSecuencia } from '@/services/clientMainService';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage, formatDOP } from '@/lib/utils';
import type { Factura } from '@/lib/types';

const convertirSchema = z.object({
  numero_factura: z.string().optional(),
  tipo_comprobante: z.string().min(1, 'Seleccione un tipo de comprobante').max(30),
  numero_comprobante: z.string().max(50).optional().or(z.literal('')),
  fecha_emision: z.string().min(10, 'Fecha de emisión requerida'),
  fecha_vencimiento: z.string().min(10, 'Fecha de vencimiento requerida'),
  aplica_itbis: z.boolean().default(true),
});

type ConvertirFormValues = z.infer<typeof convertirSchema>;

interface ConvertirModalProps {
  factura: Factura | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedFactura: Factura) => void;
}

export function ConvertirModal({
  factura,
  isOpen,
  onClose,
  onSuccess,
}: ConvertirModalProps) {
  const toast = useToast();

  const { data: secuenciaData, refetch: refetchSecuencia } = useSiguienteSecuencia('FACTURA');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConvertirFormValues>({
    resolver: zodResolver(convertirSchema) as any,
    defaultValues: {
      numero_factura: '',
      tipo_comprobante: 'B01',
      numero_comprobante: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      aplica_itbis: true,
    },
  });

  useEffect(() => {
    if (factura && isOpen) {
      refetchSecuencia();
      reset({
        numero_factura: secuenciaData?.siguiente || '',
        tipo_comprobante: factura.clientes?.tipo_comprobante_defecto || 'B01',
        numero_comprobante: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        aplica_itbis: true,
      });
    }
  }, [factura, isOpen, reset, secuenciaData?.siguiente, refetchSecuencia]);

  // Sincronizar número correlativo automático
  useEffect(() => {
    if (isOpen && secuenciaData?.siguiente && !watch('numero_factura')) {
      setValue('numero_factura', secuenciaData.siguiente);
    }
  }, [isOpen, secuenciaData, setValue, watch]);

  const onSubmit = async (data: ConvertirFormValues) => {
    if (!factura) return;
    try {
      const updated = await api.convertirAFactura(factura.id, {
        numero_factura: (data.numero_factura || secuenciaData?.siguiente || '').trim(),
        tipo_comprobante: data.tipo_comprobante,
        numero_comprobante: data.numero_comprobante?.trim() || undefined,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento: data.fecha_vencimiento,
        aplica_itbis: true,
      });

      toast.success(
        `Cotización convertida en Factura fiscal "${updated.numero_factura}" exitosamente.`,
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(extractErrorMessage(err), 'Error al convertir a factura');
    }
  };

  if (!factura) return null;

  const currentSubtotal = Number(factura.subtotal) || 0;
  const estimatedItbis = Math.round(currentSubtotal * 0.18 * 100) / 100;
  const estimatedTotal = currentSubtotal + estimatedItbis;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convertir Cotización a Factura Fiscal"
      subtitle={`Cotización N.º ${factura.numero_cotizacion || factura.id} • ${
        factura.clientes?.nombre_razon_social
      }`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Info Banner */}
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-950 flex items-start gap-2.5">
          <FileProtectOutlined className="text-[#0066B3] text-base shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            Esta acción transformará la cotización a estado <strong>EMITIDA</strong>, generando una
            deuda exigible en el estado de cuenta de{' '}
            <strong>{factura.clientes?.nombre_razon_social}</strong>.
          </div>
        </div>

        {/* Número de Factura Automático */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">
              Número de Factura Fiscal
            </label>
            <span className="text-[10px] text-[#0066B3] font-bold font-mono">
              (Auto: {secuenciaData?.siguiente || 'Generando...'})
            </span>
          </div>
          <Controller
            name="numero_factura"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={secuenciaData?.siguiente || field.value || ''}
                readOnly
                placeholder={secuenciaData?.siguiente || 'FAC-DDMMYYYY-####'}
                className="font-mono font-bold bg-slate-50 text-slate-900 border-slate-300"
              />
            )}
          />
        </div>

        {/* Tipo Comprobante & NCF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipo de Comprobante DGII *
            </label>
            <Controller
              name="tipo_comprobante"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  className="w-full font-semibold"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              NCF Oficial DGII (Opcional)
            </label>
            <Controller
              name="numero_comprobante"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Número NCF (vacío si aún no asignado)"
                  className="font-mono uppercase font-bold"
                />
              )}
            />
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CalendarOutlined className="text-slate-500" />
              Fecha de Emisión *
            </label>
            <Controller
              name="fecha_emision"
              control={control}
              render={({ field }) => (
                <Input type="date" {...field} className="font-mono" />
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CalendarOutlined className="text-slate-500" />
              Fecha de Vencimiento *
            </label>
            <Controller
              name="fecha_vencimiento"
              control={control}
              render={({ field }) => (
                <Input type="date" {...field} className="font-mono" />
              )}
            />
          </div>
        </div>

        {/* Fila ITBIS Obligatorio */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PercentageOutlined className="text-[#0066B3]" />
              <span>ITBIS (18%) Obligatorio</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Aplicado obligatoriamente por normativa a todas las facturas.
            </p>
          </div>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatDOP(estimatedItbis)}
          </span>
        </div>

        {/* Resumen Calculado */}
        <div className="p-4 bg-slate-100/80 rounded-2xl text-xs space-y-1.5 font-mono border border-slate-200">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-bold text-slate-900">{formatDOP(currentSubtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>ITBIS (18%):</span>
            <span className="font-bold text-slate-900">{formatDOP(estimatedItbis)}</span>
          </div>
          <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200 text-sm">
            <span>Total Facturado:</span>
            <span className="text-[#0066B3]">{formatDOP(estimatedTotal)}</span>
          </div>
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
            icon={<ArrowRightOutlined />}
            className="bg-[#0066B3] hover:bg-[#004E8A]"
          >
            Confirmar y Emitir Factura
          </Button>
        </div>
      </form>
    </Modal>
  );
}
