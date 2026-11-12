'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Input, Segmented, Tag } from 'antd';
import {
  SearchOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useCobros } from '@/services/clientMainService';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { formatDOP, formatDate } from '@/lib/utils';
import { Receipt } from 'lucide-react';

type MetodoFilter = 'TODOS' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'TARJETA';

function CobrosContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [metodoFilter, setMetodoFilter] = useState<MetodoFilter>('TODOS');

  const { data: cobrosData, isLoading } = useCobros({
    limit: 100,
    metodo: metodoFilter !== 'TODOS' ? metodoFilter : undefined,
  });

  const cobros = cobrosData?.data || [];

  const filteredCobros = useMemo(() => {
    if (!searchTerm.trim()) return cobros;
    const term = searchTerm.toLowerCase();
    return cobros.filter(
      (c) =>
        c.recibo_numero.toLowerCase().includes(term) ||
        (c.referencia_transaccion && c.referencia_transaccion.toLowerCase().includes(term)) ||
        (c.clientes?.nombre_razon_social &&
          c.clientes.nombre_razon_social.toLowerCase().includes(term)) ||
        (c.notas && c.notas.toLowerCase().includes(term)),
    );
  }, [cobros, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1">
            <DollarCircleOutlined />
            <span>Recaudación y Conciliación</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Recibos de Cobro Oficiales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial de cobros y abonos aplicados. Para rectificaciones, devoluciones o cancelaciones contables, emita una <strong>Nota de Crédito Electrónica (E34)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link href="/documentos/nuevo?tipo=E34" className="w-full sm:w-auto">
            <Button
              type="primary"
              size="large"
              icon={<FileTextOutlined />}
              className="w-full sm:w-auto bg-[#0066B3] hover:bg-[#004E8A] font-bold shadow-md flex items-center justify-center gap-1.5"
            >
              Emitir Nota de Crédito (E34)
            </Button>
          </Link>
          <Link href="/documentos" className="w-full sm:w-auto">
            <Button
              size="large"
              icon={<Receipt className="w-4 h-4 text-slate-600" />}
              className="w-full sm:w-auto font-bold border-slate-300 hover:border-slate-400 flex items-center justify-center gap-1.5"
            >
              Ver Facturas
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="overflow-x-auto">
          <Segmented
            value={metodoFilter}
            onChange={(val) => setMetodoFilter(val as MetodoFilter)}
            options={[
              { label: 'Todos los Métodos', value: 'TODOS' },
              { label: 'Transferencias', value: 'TRANSFERENCIA' },
              { label: 'Efectivo', value: 'EFECTIVO' },
              { label: 'Cheques', value: 'CHEQUE' },
              { label: 'Tarjetas', value: 'TARJETA' },
            ]}
            className="font-bold p-1 bg-slate-200/80 shadow-inner"
          />
        </div>

        <div className="w-full lg:w-96">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            allowClear
            size="large"
            placeholder="Buscar por recibo, cliente, referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-medium"
          />
        </div>
      </div>

      {/* Cobros Table */}
      <div className="glass-panel rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20">
            <MadeleLoader
              size="md"
              text="Cargando recibos de cobro..."
              subtext="Verificando abonos y aplicaciones a facturas"
            />
          </div>
        ) : filteredCobros.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">No se encontraron recibos</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Los cobros se registran al aplicar pagos a facturas emitidas desde la bandeja comercial.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-[#0066B3]/8 text-[#0066B3] border-b border-slate-200 font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">N.º Recibo</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Facturas Aplicadas</th>
                  <th className="py-3.5 px-4">Método / Referencia</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Monto Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCobros.map((cobro) => {
                  const isAnulado = cobro.estado === 'ANULADO';
                  const facturasVinculadas = (cobro.cobro_facturas || [])
                    .map((cf) => cf.facturas?.numero_factura || cf.factura_id)
                    .filter(Boolean);

                  return (
                    <tr
                      key={cobro.id}
                      className="hover:bg-sky-50/30 transition-colors group"
                    >
                      {/* Recibo Número */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        <span className="text-[#0066B3]">{cobro.recibo_numero}</span>
                      </td>

                      {/* Fecha */}
                      <td className="py-4 px-4 font-mono text-slate-600">
                        {formatDate(cobro.fecha_cobro)}
                      </td>

                      {/* Cliente */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[200px]">
                          {cobro.clientes?.nombre_razon_social || 'Cliente'}
                        </div>
                        {cobro.clientes?.persona_contacto && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {cobro.clientes.persona_contacto}
                          </div>
                        )}
                      </td>

                      {/* Facturas Aplicadas */}
                      <td className="py-4 px-4">
                        {facturasVinculadas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {facturasVinculadas.map((fn, idx) => (
                              <Tag key={idx} color="geekblue" className="font-mono text-[10px]">
                                {fn}
                              </Tag>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Método */}
                      <td className="py-4 px-4">
                        <Tag color={cobro.metodo === 'TRANSFERENCIA' ? 'blue' : cobro.metodo === 'EFECTIVO' ? 'green' : 'orange'}>
                          {cobro.metodo}
                        </Tag>
                        {cobro.referencia_transaccion && (
                          <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                            Ref: {cobro.referencia_transaccion}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        {isAnulado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700">
                            <CloseCircleOutlined /> ANULADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircleOutlined /> PROCESADO
                          </span>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900">
                        <span className={isAnulado ? 'line-through text-slate-400' : 'text-emerald-700'}>
                          {formatDOP(cobro.monto_total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CobrosPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando cobros...</div>}>
      <CobrosContent />
    </React.Suspense>
  );
}
