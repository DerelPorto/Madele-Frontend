'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer } from '@/components/ui/Modal';
import { EstadoFacturaBadge } from '@/components/ui/Badge';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { api } from '@/lib/api';
import { formatDOP, formatDate } from '@/lib/utils';
import type { Cliente, Factura } from '@/lib/types';
import { Button } from 'antd';
import { PrinterOutlined, DollarCircleOutlined } from '@ant-design/icons';
import {
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  CreditCard,
  Building,
} from 'lucide-react';
import Link from 'next/link';

interface EstadoCuentaDrawerProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onCobrarFactura?: (factura: Factura) => void;
}

export function EstadoCuentaDrawer({
  cliente,
  isOpen,
  onClose,
  onCobrarFactura,
}: EstadoCuentaDrawerProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['estado-cuenta', cliente?.id],
    queryFn: () => (cliente ? api.getEstadoCuenta(cliente.id) : null),
    enabled: !!cliente && isOpen,
  });

  if (!cliente) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Estado de Cuenta"
      subtitle={`${cliente.codigo_cliente} • ${cliente.nombre_razon_social}`}
    >
      {isLoading ? (
        <div className="py-16">
          <MadeleLoader
            size="md"
            text="Calculando estado de cuenta..."
            subtext="Conciliando facturas y cobros aplicados"
          />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          No se pudo cargar el estado de cuenta del cliente.
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Client summary pill */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Building className="w-4 h-4 text-[#0066B3]" />
              {cliente.nombre_razon_social}
            </div>
            {cliente.persona_contacto && (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-700">Contacto:</span>{' '}
                {cliente.persona_contacto}
              </p>
            )}
            {cliente.direccion && (
              <p className="text-slate-500 truncate">{cliente.direccion}</p>
            )}
          </div>

          {/* KPI Financial Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between text-slate-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Saldo Pendiente
                </span>
                <Clock className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {formatDOP(data.resumen.saldo_total_pendiente)}
              </div>
              <p className="text-[10px] text-red-600 mt-1 font-semibold">
                {data.resumen.cantidad_facturas_pendientes}{' '}
                {data.resumen.cantidad_facturas_pendientes === 1
                  ? 'factura por cobrar'
                  : 'facturas por cobrar'}
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Total Cobrado
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-950">
                {formatDOP(data.resumen.total_historico_cobrado)}
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">
                Histórico acumulado
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Límite de Crédito
              </div>
              <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                {formatDOP(data.cliente.limite_credito)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Crédito Disponible
              </div>
              <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                {formatDOP(data.resumen.credito_disponible)}
              </div>
            </div>
          </div>

          {/* Pending Invoices Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#0066B3]" />
                Facturas Pendientes de Cobro ({data.facturas_pendientes.length})
              </h4>
            </div>

            {data.facturas_pendientes.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">
                  ¡Este cliente está al día!
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No posee facturas pendientes de pago en el sistema.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.facturas_pendientes.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#0066B3]/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {fac.numero_factura || `ID #${fac.id}`}
                        </span>
                        <EstadoFacturaBadge estado={fac.estado} />
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-red-600">
                          Pendiente: {formatDOP(fac.saldo_pendiente)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Total: {formatDOP(fac.total)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div>
                        Vence: <span className="font-medium">{formatDate(fac.fecha_vencimiento)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/documentos/${fac.id}/imprimir`}>
                          <Button size="small" icon={<PrinterOutlined />}>
                            Imprimir
                          </Button>
                        </Link>
                        {onCobrarFactura && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<DollarCircleOutlined />}
                            onClick={() => onCobrarFactura(fac as any)}
                            className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                          >
                            Cobrar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
