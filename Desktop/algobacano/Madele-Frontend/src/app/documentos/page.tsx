'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button, Input, Segmented, Popconfirm, Tooltip, Modal } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  PrinterOutlined,
  DollarCircleOutlined,
  StopOutlined,
  QuestionCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';
import { EstadoFacturaBadge } from '@/components/ui/Badge';
import { ConvertirModal } from '@/components/documentos/ConvertirModal';
import { CobroModal } from '@/components/documentos/CobroModal';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { formatDOP, formatDate } from '@/lib/utils';
import type { Factura, EstadoFactura } from '@/lib/types';
import {
  FileText,
  Building,
  User,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage } from '@/lib/utils';

type FilterTab = 'TODAS' | 'COTIZACION' | 'POR_COBRAR' | 'PAGADA' | 'ANULADA';

function DocumentosContent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [facturaToConvert, setFacturaToConvert] = useState<Factura | null>(null);
  const [facturaToCobrar, setFacturaToCobrar] = useState<Factura | null>(null);
  const [facturaToAnular, setFacturaToAnular] = useState<Factura | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [isAnuling, setIsAnuling] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => api.getFacturas({ limit: 100 }),
  });

  const handleConfirmAnular = async () => {
    if (!facturaToAnular) return;
    try {
      setIsAnuling(true);
      await api.anularFactura(facturaToAnular.id, {
        motivo_anulacion: motivoAnulacion.trim() || undefined,
      });
      toast.success(`Documento anulado correctamente.`);
      setFacturaToAnular(null);
      setMotivoAnulacion('');
      refetch();
    } catch (err: any) {
      toast.error(extractErrorMessage(err), 'No se pudo anular el documento');
    } finally {
      setIsAnuling(false);
    }
  };

  const filteredDocs = useMemo(() => {
    if (!data?.data) return [];
    let list = data.data;

    // Filter by tab
    if (activeTab === 'COTIZACION') {
      list = list.filter((f) => f.estado === 'COTIZACION');
    } else if (activeTab === 'POR_COBRAR') {
      list = list.filter((f) => f.estado === 'EMITIDA' || f.estado === 'PAGADA_PARCIAL');
    } else if (activeTab === 'PAGADA') {
      list = list.filter((f) => f.estado === 'PAGADA');
    } else if (activeTab === 'ANULADA') {
      list = list.filter((f) => f.estado === 'ANULADA');
    }

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (f) =>
          (f.numero_factura && f.numero_factura.toLowerCase().includes(term)) ||
          (f.numero_cotizacion && f.numero_cotizacion.toLowerCase().includes(term)) ||
          (f.numero_comprobante && f.numero_comprobante.toLowerCase().includes(term)) ||
          (f.titulo_servicio && f.titulo_servicio.toLowerCase().includes(term)) ||
          (f.clientes?.nombre_razon_social &&
            f.clientes.nombre_razon_social.toLowerCase().includes(term)) ||
          (f.clientes?.persona_contacto &&
            f.clientes.persona_contacto.toLowerCase().includes(term)),
      );
    }

    return list;
  }, [data?.data, activeTab, searchTerm]);

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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0066B3]/10 text-[#0066B3] text-[10px] font-bold uppercase tracking-wider mb-1">
            <FileText className="w-3 h-3 text-[#0066B3]" />
            Bandeja Comercial
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Cotizaciones y Facturas Fiscales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de propuestas comerciales, conversión a crédito fiscal DGII, cobros y vista de impresión
          </p>
        </div>

        <Link href="/documentos/nuevo" className="w-full sm:w-auto">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="w-full sm:w-auto bg-[#0066B3] hover:bg-[#004E8A] font-bold rounded-2xl shadow-lg shadow-[#0066B3]/25 flex items-center justify-center"
          >
            Nueva Cotización / Factura
          </Button>
        </Link>
      </div>

      {/* Filter Tabs with Ant Design Segmented and Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Ant Design Segmented Filter */}
        <div className="overflow-x-auto">
          <Segmented
            value={activeTab}
            onChange={(val) => setActiveTab(val as FilterTab)}
            options={[
              { label: 'Todas', value: 'TODAS' },
              { label: 'Cotizaciones', value: 'COTIZACION' },
              { label: 'Por Cobrar', value: 'POR_COBRAR' },
              { label: 'Pagadas', value: 'PAGADA' },
              { label: 'Anuladas', value: 'ANULADA' },
            ]}
            className="font-bold p-1 bg-slate-200/80 shadow-inner"
          />
        </div>

        {/* Ant Design Search Input */}
        <div className="min-w-[300px]">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            allowClear
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por doc #, NCF, cliente, servicio..."
            className="font-medium"
          />
        </div>
      </div>

      {/* Documents Table Container */}
      <div className="glass-panel rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20">
            <MadeleLoader
              size="md"
              text="Cargando documentos comerciales..."
              subtext="Consultando cotizaciones y facturas fiscales"
            />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No hay documentos con este filtro</p>
            <p className="text-xs text-slate-400">
              Crea una nueva cotización o ajusta los criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Documento / N.º</th>
                  <th className="py-3.5 px-4">Cliente / Contacto</th>
                  <th className="py-3.5 px-4">Concepto / Servicio</th>
                  <th className="py-3.5 px-4">Fecha Emisión</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Total DOP</th>
                  <th className="py-3.5 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const isCotizacion = doc.estado === 'COTIZACION';
                  const isPendingPay =
                    doc.estado === 'EMITIDA' || doc.estado === 'PAGADA_PARCIAL';

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-sky-50/50 transition-colors group"
                    >
                      {/* Documento / N.º */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          {isCotizacion ? (
                            <div className="font-mono font-black text-[#0066B3] text-xs">
                              COT-#{doc.numero_cotizacion || doc.id}
                            </div>
                          ) : (
                            <div className="font-mono font-black text-slate-900 text-xs">
                              {doc.numero_factura || `FAC-${doc.id}`}
                            </div>
                          )}
                          {doc.numero_comprobante && (
                            <div className="font-mono text-[10px] text-slate-500 font-bold">
                              NCF: {doc.numero_comprobante}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {doc.clientes?.nombre_razon_social || 'Cliente Sin Asignar'}
                            </span>
                          </div>
                          {doc.clientes?.persona_contacto && (
                            <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                              <User className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {doc.clientes.persona_contacto}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Concepto / Servicio */}
                      <td className="py-4 px-4 max-w-[220px]">
                        <p className="text-slate-700 font-medium truncate" title={doc.titulo_servicio || ''}>
                          {doc.titulo_servicio || '—'}
                        </p>
                      </td>

                      {/* Fecha Emisión */}
                      <td className="py-4 px-4 font-mono text-slate-600 font-medium">
                        {formatDate(doc.fecha_emision)}
                      </td>

                      {/* Estado Badge */}
                      <td className="py-4 px-4">
                        <EstadoFacturaBadge estado={doc.estado} />
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatDOP(doc.total)}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="py-4 px-4 text-right font-mono font-bold">
                        {isCotizacion ? (
                          <span className="text-slate-400 font-normal italic">
                            No exigible
                          </span>
                        ) : Number(doc.saldo_pendiente) > 0 ? (
                          <span className="text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-mono font-extrabold text-[11px]">
                            {formatDOP(doc.saldo_pendiente)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">RD$ 0.00</span>
                        )}
                      </td>

                      {/* Acciones with Ant Design Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Acción 1: Convertir */}
                          {isCotizacion && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<ArrowRightOutlined />}
                              onClick={() => setFacturaToConvert(doc)}
                              className="bg-[#0066B3] font-bold"
                            >
                              Convertir
                            </Button>
                          )}

                          {/* Acción 2: Cobrar */}
                          {isPendingPay && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<DollarCircleOutlined />}
                              onClick={() => setFacturaToCobrar(doc)}
                              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                            >
                              Cobrar
                            </Button>
                          )}

                          {/* Acción 3: Editar (solo cotizaciones) */}
                          {isCotizacion && (
                            <Link href={`/documentos/${doc.id}/editar`}>
                              <Tooltip title="Editar Cotización">
                                <Button size="small" icon={<EditOutlined className="text-[#0066B3]" />} />
                              </Tooltip>
                            </Link>
                          )}

                          {/* Acción 4: Imprimir */}
                          <Link href={`/documentos/${doc.id}/imprimir`}>
                            <Tooltip title="Ver / Imprimir Documento Oficial">
                              <Button
                                size="small"
                                icon={<PrinterOutlined />}
                              />
                            </Tooltip>
                          </Link>

                          {/* Acción 5: Anular */}
                          {doc.estado !== 'ANULADA' && doc.estado !== 'PAGADA' && (
                            <Tooltip title="Anular documento">
                              <Button
                                size="small"
                                danger
                                icon={<StopOutlined />}
                                onClick={() => {
                                  setFacturaToAnular(doc);
                                  setMotivoAnulacion('');
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convertir Modal */}
      {facturaToConvert && (
        <ConvertirModal
          factura={facturaToConvert}
          isOpen={!!facturaToConvert}
          onClose={() => setFacturaToConvert(null)}
          onSuccess={() => {
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0066B3', '#F59E0B', '#10B981'],
              });
            } catch {}
            queryClient.invalidateQueries({ queryKey: ['facturas'] });
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            refetch();
          }}
        />
      )}

      {/* Cobro Modal */}
      {facturaToCobrar && (
        <CobroModal
          factura={facturaToCobrar}
          isOpen={!!facturaToCobrar}
          onClose={() => setFacturaToCobrar(null)}
          onSuccess={() => {
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10B981', '#0066B3', '#F59E0B'],
              });
            } catch {}
            queryClient.invalidateQueries({ queryKey: ['facturas'] });
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            refetch();
          }}
        />
      )}

      {/* Modal de Anulación con Motivo de Auditoría */}
      <Modal
        open={!!facturaToAnular}
        onCancel={() => {
          if (!isAnuling) {
            setFacturaToAnular(null);
            setMotivoAnulacion('');
          }
        }}
        onOk={handleConfirmAnular}
        okText="Confirmar Anulación"
        cancelText="Volver"
        confirmLoading={isAnuling}
        okButtonProps={{ danger: true, className: 'font-bold' }}
        title={
          <div className="text-red-600 font-extrabold flex items-center gap-2">
            <StopOutlined />
            <span>Anular Documento Comercial</span>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-xs">
          <p className="text-slate-600 leading-relaxed">
            ¿Está seguro de anular el documento{' '}
            <strong className="text-slate-900 font-mono">
              {facturaToAnular?.numero_factura || facturaToAnular?.numero_cotizacion || facturaToAnular?.id}
            </strong>{' '}
            de <strong>{facturaToAnular?.clientes?.nombre_razon_social}</strong>? Esta acción ajustará el saldo pendiente a 0 y quedará registrada con motivo de auditoría.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo o Justificación de la Anulación (Opcional):
            </label>
            <Input.TextArea
              rows={3}
              placeholder="Indique el motivo o justificación de la anulación..."
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

export default function DocumentosPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando documentos...</div>}>
      <DocumentosContent />
    </React.Suspense>
  );
}
