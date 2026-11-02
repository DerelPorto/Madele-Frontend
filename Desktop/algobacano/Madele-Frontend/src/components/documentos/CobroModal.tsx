'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, InputNumber } from 'antd';
import {
  CheckCircleOutlined,
  CloseOutlined,
  DollarCircleOutlined,
  BankOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useSiguienteRecibo } from '@/services/clientMainService';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage, formatDOP } from '@/lib/utils';
import type { Factura, MetodoPago } from '@/lib/types';

const cobroSchema = z.object({
  recibo_numero: z.string().min(2, 'Número de recibo obligatorio').max(50),
  monto_total: z.coerce
    .number()
    .min(0.01, 'El monto a cobrar debe ser mayor a 0'),
  metodo: z.enum(['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE', 'OTRO']),
  referencia_transaccion: z.string().max(100).optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
});

type CobroFormValues = z.infer<typeof cobroSchema>;

interface CobroModalProps {
  factura: Factura | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CobroModal({ factura, isOpen, onClose, onSuccess }: CobroModalProps) {
  const toast = useToast();
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const { data: siguienteReciboData, refetch: refetchSiguienteRecibo } = useSiguienteRecibo();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CobroFormValues>({
    resolver: zodResolver(cobroSchema) as any,
    defaultValues: {
      recibo_numero: '',
      monto_total: 0,
      metodo: 'TRANSFERENCIA',
      referencia_transaccion: '',
      notas: '',
    },
  });

  const watchMonto = watch('monto_total');

  useEffect(() => {
    if (factura && isOpen) {
      setTriggerError(null);
      refetchSiguienteRecibo();
      const saldo = Number(factura.saldo_pendiente) || Number(factura.total) || 0;

      reset({
        recibo_numero: siguienteReciboData?.siguiente || '',
        monto_total: saldo,
        metodo: 'TRANSFERENCIA',
        referencia_transaccion: '',
        notas: `Abono a Factura ${factura.numero_factura || factura.id}`,
      });
    }
  }, [factura, isOpen, reset, siguienteReciboData?.siguiente, refetchSiguienteRecibo]);

  // If siguienteReciboData loads after open and field is empty, set it
  useEffect(() => {
    if (isOpen && siguienteReciboData?.siguiente && !watch('recibo_numero')) {
      setValue('recibo_numero', siguienteReciboData.siguiente);
    }
  }, [isOpen, siguienteReciboData, setValue, watch]);

  const onSubmit = async (data: CobroFormValues) => {
    if (!factura) return;
    setTriggerError(null);

    try {
      await api.createCobro({
        recibo_numero: data.recibo_numero.trim(),
        cliente_id: factura.cliente_id,
        monto_total: data.monto_total,
        metodo: data.metodo as MetodoPago,
        referencia_transaccion: data.referencia_transaccion?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
        aplicaciones: [
          {
            factura_id: factura.id,
            monto_aplicado: data.monto_total,
          },
        ],
      });

      toast.success(
        `Cobro de ${formatDOP(data.monto_total)} registrado exitosamente. Recibo: ${data.recibo_numero}`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err);
      setTriggerError(errorMsg);
      toast.error(errorMsg, 'Error al registrar cobro');
    }
  };

  if (!factura) return null;

  const saldoPendiente = Number(factura.saldo_pendiente) || 0;
  const nuevoSaldo = Math.max(0, saldoPendiente - (Number(watchMonto) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Cobro / Aplicar Pago"
      subtitle={`Factura ${factura.numero_factura || factura.id} • ${
        factura.clientes?.nombre_razon_social
      }`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Trigger Error Banner if any */}
        {triggerError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-2.5 animate-in fade-in">
            <ExclamationCircleOutlined className="text-red-600 text-base shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">
              <span className="font-bold">Aviso de Validación: </span>
              {triggerError}
            </div>
          </div>
        )}

        {/* Client & Debt Info */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Cliente:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <BankOutlined className="text-[#0066B3]" />
              {factura.clientes?.nombre_razon_social}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total Factura:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatDOP(factura.total)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
            <span className="font-bold text-amber-900">Saldo Pendiente Actual:</span>
            <span className="font-mono font-black text-amber-900 text-sm">
              {formatDOP(saldoPendiente)}
            </span>
          </div>
        </div>

        {/* Recibo Número & Monto with Antd */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                N.º de Recibo Oficial *
              </label>
              {siguienteReciboData?.siguiente && (
                <button
                  type="button"
                  onClick={() => setValue('recibo_numero', siguienteReciboData.siguiente)}
                  className="text-[10px] text-[#0066B3] font-bold hover:underline cursor-pointer"
                >
                  Auto: {siguienteReciboData.siguiente}
                </button>
              )}
            </div>
            <Controller
              name="recibo_numero"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Número de recibo de cobro"
                  className="font-mono font-bold"
                  status={errors.recibo_numero ? 'error' : ''}
                />
              )}
            />
            {errors.recibo_numero && (
              <p className="text-[11px] text-red-600 mt-0.5">{errors.recibo_numero.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Monto a Cobrar (DOP) *
            </label>
            <Controller
              name="monto_total"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  className="w-full font-mono font-bold text-emerald-950"
                  prefix="RD$"
                  step={500}
                  min={0.01}
                />
              )}
            />
            {errors.monto_total && (
              <p className="text-[11px] text-red-600 mt-0.5">{errors.monto_total.message}</p>
            )}
          </div>
        </div>

        {/* Live Balance Projection */}
        <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-[11px] font-mono flex items-center justify-between text-slate-600 font-medium">
          <span>Nuevo Saldo tras este pago:</span>
          <span
            className={`font-black ${
              nuevoSaldo === 0 ? 'text-emerald-700 font-bold' : 'text-amber-800'
            }`}
          >
            {formatDOP(nuevoSaldo)} {nuevoSaldo === 0 && '(Saldada 100%)'}
          </span>
        </div>

        {/* Método de Pago & Referencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Método de Pago *
            </label>
            <Controller
              name="metodo"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  className="w-full font-semibold"
                  options={[
                    { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
                    { value: 'EFECTIVO', label: 'Efectivo' },
                    { value: 'CHEQUE', label: 'Cheque' },
                    { value: 'TARJETA', label: 'Tarjeta Débito/Crédito' },
                    { value: 'OTRO', label: 'Otro' },
                  ]}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Referencia / No. Transacción
            </label>
            <Controller
              name="referencia_transaccion"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Referencia de transferencia o cheque..."
                  className="font-mono font-medium"
                />
              )}
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Notas del Cobro
          </label>
          <Controller
            name="notas"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder="Observaciones adicionales sobre la transacción..."
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
            icon={<CheckCircleOutlined />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Confirmar y Procesar Cobro
          </Button>
        </div>
      </form>
    </Modal>
  );
}
