'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Input, Segmented, Tooltip, Button, Tag } from 'antd';
import {
  SearchOutlined,
  PrinterOutlined,
  DollarOutlined,
  SwapOutlined,
  EditOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useDashboardKpis, useFacturas, useDatosEmpresa } from '@/services/clientMainService';
import { EstadoFacturaBadge } from '@/components/ui/Badge';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { CobroModal } from '@/components/documentos/CobroModal';
import { ConvertirModal } from '@/components/documentos/ConvertirModal';
import { formatDOP, formatDate } from '@/lib/utils';
import type { Factura } from '@/types';
import {
  FileText,
  Users,
  PlusCircle,
  Zap,
  TrendingUp,
  Clock,
  Printer,
  ArrowRight,
  ShieldCheck,
  Building,
  CreditCard,
  CheckCircle,
  Activity,
  Layers,
  Sparkles,
  AlertTriangle,
  Receipt,
  FileCheck,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

type DocumentFilterTab = 'TODOS' | 'COTIZACIONES' | 'PENDIENTES' | 'PAGADAS';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: kpis, isLoading: loadingKpis } = useDashboardKpis();
  const { data: facturasData, isLoading: loadingFacturas } = useFacturas({ limit: 12 });
  const { data: empresa } = useDatosEmpresa();

  const [filterTab, setFilterTab] = useState<DocumentFilterTab>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedFacturaCobro, setSelectedFacturaCobro] = useState<Factura | null>(null);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [selectedFacturaConvertir, setSelectedFacturaConvertir] = useState<Factura | null>(null);
  const [isConvertirModalOpen, setIsConvertirModalOpen] = useState(false);

  const facturas = useMemo(() => facturasData?.data || [], [facturasData]);

  // Operational metrics
  const cotizacionesCount = kpis?.cantidad_cotizaciones_activas ?? 0;
  const facturasPorCobrarCount = kpis?.cantidad_facturas_por_cobrar ?? 0;
  const facturasVencidasCount = kpis?.cantidad_facturas_vencidas ?? 0;
  const totalPendiente = Number(kpis?.total_pendiente_cobro) || 0;
  const totalCobrado = Number(kpis?.total_cobrado_historico) || 0;
  const clientesCount = kpis?.total_clientes_activos ?? 0;

  const grandTotal = totalPendiente + totalCobrado;
  const cobroPercentage = grandTotal > 0 ? Math.round((totalCobrado / grandTotal) * 100) : 0;

  // Filtered documents
  const filteredFacturas = useMemo(() => {
    let result = facturas;

    // Filter by tab
    if (filterTab === 'COTIZACIONES') {
      result = result.filter((f) => f.estado === 'COTIZACION' || f.estado === 'BORRADOR');
    } else if (filterTab === 'PENDIENTES') {
      result = result.filter(
        (f) =>
          (f.estado === 'EMITIDA' || f.estado === 'PAGADA_PARCIAL') &&
          Number(f.saldo_pendiente) > 0,
      );
    } else if (filterTab === 'PAGADAS') {
      result = result.filter((f) => f.estado === 'PAGADA');
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.numero_factura?.toLowerCase().includes(q) ||
          f.numero_cotizacion?.toLowerCase().includes(q) ||
          f.clientes?.nombre_razon_social?.toLowerCase().includes(q) ||
          f.titulo_servicio?.toLowerCase().includes(q) ||
          f.numero_comprobante?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [facturas, filterTab, searchTerm]);

  // Tab counts
  const countCotizaciones = useMemo(
    () => facturas.filter((f) => f.estado === 'COTIZACION' || f.estado === 'BORRADOR').length,
    [facturas],
  );
  const countPendientes = useMemo(
    () =>
      facturas.filter(
        (f) =>
          (f.estado === 'EMITIDA' || f.estado === 'PAGADA_PARCIAL') &&
          Number(f.saldo_pendiente) > 0,
      ).length,
    [facturas],
  );
  const countPagadas = useMemo(
    () => facturas.filter((f) => f.estado === 'PAGADA').length,
    [facturas],
  );

  const handleOpenCobro = (f: Factura) => {
    setSelectedFacturaCobro(f);
    setIsCobroModalOpen(true);
  };

  const handleOpenConvertir = (f: Factura) => {
    setSelectedFacturaConvertir(f);
    setIsConvertirModalOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['facturas'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['cobros'] });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-3 sm:p-5 md:p-6 max-w-[1700px] mx-auto w-full space-y-5"
    >
      {/* Top Executive Header Strip */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#003B6F] to-[#0066B3] p-5 sm:p-7 text-white shadow-xl shadow-[#0066B3]/15 border border-sky-400/20"
      >
        {/* Ambient lighting glows */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-sky-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-white border border-white/20">
                <Sparkles className="w-3 h-3 fill-sky-200 text-sky-200" />
                {empresa?.nombre_corto || 'MADELES'} • {empresa?.eslogan || 'Electroservicios SRL'}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sincronizado en Vivo
              </span>

              <span className="text-[11px] text-sky-200/80 font-mono hidden sm:inline">
                RNC: <strong>{empresa?.rnc || '—'}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              Centro de Mando y Operaciones Comerciales
            </h1>

            <p className="text-xs text-sky-100/85 font-normal leading-relaxed max-w-2xl">
              Control de emisión de cotizaciones técnicas, validación fiscal de comprobantes DGII y conciliación de cobros en {empresa?.moneda || 'Pesos Dominicanos (DOP)'}.
            </p>
          </div>

          {/* Quick Action Launchers */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/documentos/nuevo"
              className="px-4 py-2.5 bg-[#0066B3] hover:bg-[#004E8A] text-white font-black rounded-xl text-xs shadow-lg shadow-[#0066B3]/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-sky-400/40"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              Nueva Cotización / Factura
            </Link>

            <Link
              href="/cobros"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-white" />
              Recibos de Cobro
            </Link>

            <Link
              href="/clientes"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-sky-300" />
              Clientes
            </Link>
          </div>
        </div>

        {/* Brand watermark emblem */}
        <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none select-none hidden md:block">
          <Image
            src="/logo.png"
            alt="MADELES Emblem"
            width={220}
            height={220}
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* 4 High-Density Operational KPI Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
      >
        {/* KPI 1: Saldo Pendiente */}
        <div className="glass-card p-4 rounded-xl border border-slate-200 bg-white shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0066B3]" />
              Saldo por Cobrar
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-100 text-slate-800 font-mono border border-slate-200">
              {facturasPorCobrarCount} fac
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
              {formatDOP(totalPendiente)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-medium">
              <span>Pendiente de liquidación</span>
              {facturasVencidasCount > 0 ? (
                <span className="text-red-600 font-black flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {facturasVencidasCount} vencida{facturasVencidasCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Al día
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Total Cobrado Histórico */}
        <div className="glass-card p-4 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Total Cobrado
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-200/60 text-emerald-900 font-mono">
              {cobroPercentage}% recuperado
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-emerald-950 tracking-tight">
              {formatDOP(totalCobrado)}
            </div>
            <div className="mt-2 w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${cobroPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-1">
              Conciliado con recibos emitidos
            </div>
          </div>
        </div>

        {/* KPI 3: Cotizaciones Técnicas Activas */}
        <div
          onClick={() => setFilterTab('COTIZACIONES')}
          className="glass-card p-4 rounded-xl border border-sky-200/90 bg-gradient-to-br from-white to-sky-50/40 shadow-xs relative overflow-hidden group cursor-pointer hover:border-[#0066B3] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0066B3] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#0066B3]" />
              Cotizaciones Activas
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-sky-100 text-[#0066B3] font-mono">
              Listas
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
              {cotizacionesCount}
            </div>
            <div className="text-[11px] text-[#0066B3] font-bold mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Listas para conversión a factura DGII
            </div>
          </div>
        </div>

        {/* KPI 4: Clientes y Cartera */}
        <Link
          href="/clientes"
          className="glass-card p-4 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-[#0066B3] transition-colors block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              Clientes en Cartera
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
              Directorio
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
              {clientesCount}
            </div>
            <div className="text-[11px] text-[#0066B3] font-bold mt-1 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Consultar estados de cuenta</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Main Split-Screen High-Density Ledger */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Main Table Ledger (8 of 12 cols = ~66%) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col bg-white">
          {/* Table Header with Title & Filter Controls */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0066B3]" />
                  <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                    Bandeja Operativa de Documentos
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0066B3] text-[10px] font-mono font-bold">
                    {filteredFacturas.length} mostrados
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cotizaciones técnicas y facturas fiscales con acciones inmediatas en 1 clic
                </p>
              </div>

              <Link
                href="/documentos"
                className="text-xs font-bold text-[#0066B3] hover:text-[#004E8A] inline-flex items-center gap-1 group shrink-0"
              >
                <span>Ver bandeja completa</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Filter Tabs & Instant Search Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <Segmented<DocumentFilterTab>
                value={filterTab}
                onChange={(val) => setFilterTab(val)}
                options={[
                  { label: `Todas (${facturas.length})`, value: 'TODOS' },
                  { label: `Cotizaciones (${countCotizaciones})`, value: 'COTIZACIONES' },
                  { label: `Por Cobrar (${countPendientes})`, value: 'PENDIENTES' },
                  { label: `Pagadas (${countPagadas})`, value: 'PAGADAS' },
                ]}
                className="bg-slate-200/70 p-0.5 text-xs font-bold"
              />

              <div className="w-full sm:w-64">
                <Input
                  size="middle"
                  placeholder="Buscar doc, cliente o NCF..."
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  className="rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto">
            {loadingFacturas ? (
              <div className="py-16">
                <MadeleLoader
                  size="md"
                  text="Cargando documentos comerciales..."
                  subtext="Consultando base de datos PostgreSQL"
                />
              </div>
            ) : filteredFacturas.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">
                  No se encontraron documentos en este filtro.
                </p>
                <p className="text-[11px] text-slate-400">
                  {searchTerm
                    ? 'Intenta con otro término de búsqueda o limpia el filtro.'
                    : 'Puedes crear una nueva cotización o factura con el botón superior.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200/70 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Documento</th>
                    <th className="py-2.5 px-3.5">Cliente</th>
                    <th className="py-2.5 px-3.5">Concepto / Servicio</th>
                    <th className="py-2.5 px-3.5">Fecha</th>
                    <th className="py-2.5 px-3.5">Estado</th>
                    <th className="py-2.5 px-3.5 text-right">Total DOP</th>
                    <th className="py-2.5 px-3.5 text-right">Pendiente</th>
                    <th className="py-2.5 px-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFacturas.map((f) => {
                    const isCotizacion = f.estado === 'COTIZACION' || f.estado === 'BORRADOR';
                    const isPorCobrar =
                      !isCotizacion &&
                      f.estado !== 'ANULADA' &&
                      f.estado !== 'PAGADA' &&
                      Number(f.saldo_pendiente) > 0;

                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-sky-50/40 transition-colors group text-[11px]"
                      >
                        {/* Document Number */}
                        <td className="py-2.5 px-3.5 font-mono font-bold whitespace-nowrap">
                          {isCotizacion ? (
                            <span className="text-[#0066B3] inline-flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              COT-#{f.numero_cotizacion || f.id.slice(0, 8)}
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-slate-900 font-extrabold block">
                                {f.numero_factura || `FAC-${f.id.slice(0, 8)}`}
                              </span>
                              {f.numero_comprobante && (
                                <span className="text-[10px] font-mono text-slate-500 block">
                                  {f.numero_comprobante}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Client */}
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                          <div className="truncate max-w-[140px]" title={f.clientes?.nombre_razon_social}>
                            {f.clientes?.nombre_razon_social || 'Cliente sin nombre'}
                          </div>
                        </td>

                        {/* Concept */}
                        <td className="py-2.5 px-3.5 text-slate-600">
                          <div className="truncate max-w-[160px]" title={f.titulo_servicio || ''}>
                            {f.titulo_servicio || '—'}
                          </div>
                        </td>

                        {/* Issue Date */}
                        <td className="py-2.5 px-3.5 text-slate-500 font-mono whitespace-nowrap">
                          {formatDate(f.fecha_emision)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <EstadoFacturaBadge estado={f.estado} />
                        </td>

                        {/* Total Amount */}
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatDOP(f.total)}
                        </td>

                        {/* Pending Balance */}
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                          {isCotizacion ? (
                            <span className="text-slate-400 font-normal">—</span>
                          ) : Number(f.saldo_pendiente) > 0 ? (
                            <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              {formatDOP(f.saldo_pendiente)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                              Saldada
                            </span>
                          )}
                        </td>

                        {/* Quick 1-Click Inline Actions */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* Print Action */}
                            <Tooltip title="Imprimir Comprobante Oficial">
                              <Link
                                href={`/documentos/${f.id}/imprimir`}
                                className="p-1.5 text-slate-600 hover:text-[#0066B3] hover:bg-sky-50 rounded-lg border border-slate-200 hover:border-sky-300 transition-colors inline-flex items-center"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </Link>
                            </Tooltip>

                            {/* Convert Quote Action (if quotation) */}
                            {isCotizacion && (
                              <Tooltip title="Convertir a Factura DGII">
                                <button
                                  type="button"
                                  onClick={() => handleOpenConvertir(f)}
                                  className="px-2 py-1 text-[10px] font-bold text-[#0066B3] bg-sky-50 hover:bg-[#0066B3] hover:text-white rounded-lg border border-sky-200 transition-colors inline-flex items-center gap-1"
                                >
                                  <SwapOutlined className="text-[10px]" />
                                  <span>Convertir</span>
                                </button>
                              </Tooltip>
                            )}

                            {/* Record Payment Action (if pending invoice) */}
                            {isPorCobrar && (
                              <Tooltip title="Registrar Cobro / Abono">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCobro(f)}
                                  className="px-2 py-1 text-[10px] font-bold text-white bg-[#0066B3] hover:bg-[#004E8A] rounded-lg border border-sky-600 transition-colors inline-flex items-center gap-1"
                                >
                                  <DollarOutlined className="text-[10px]" />
                                  <span>Cobrar</span>
                                </button>
                              </Tooltip>
                            )}

                            {/* Edit / View Action */}
                            <Tooltip title="Editar detalles">
                              <Link
                                href={`/documentos/${f.id}/editar`}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors inline-flex items-center"
                              >
                                <EditOutlined className="text-xs" />
                              </Link>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Table Bar */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Mostrando los <strong>{filteredFacturas.length}</strong> documentos más recientes
            </span>
            <Link
              href="/documentos"
              className="text-[#0066B3] hover:underline font-bold inline-flex items-center gap-1"
            >
              Ir a la bandeja con filtros avanzados y exportación →
            </Link>
          </div>
        </div>

        {/* Right Intelligence & Quick Launchers Section (4 of 12 cols = ~34%) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Cartera & Financial Health */}
          <div className="glass-card p-4 rounded-2xl border border-slate-200/90 shadow-xs bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Salud de Cartera y Cobranzas
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {cobroPercentage}% Cobrado
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Facturado Histórico:</span>
                <strong className="font-mono text-slate-900">{formatDOP(grandTotal)}</strong>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Total Cobrado:
                </span>
                <strong className="font-mono text-emerald-700">{formatDOP(totalCobrado)}</strong>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Saldo por Cobrar:
                </span>
                <strong className="font-mono text-slate-900 font-bold">{formatDOP(totalPendiente)}</strong>
              </div>

              {/* Progress visual */}
              <div className="pt-1">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-[#0066B3] h-full transition-all duration-500"
                    style={{ width: `${cobroPercentage}%` }}
                    title={`Cobrado: ${cobroPercentage}%`}
                  />
                  <div
                    className="bg-red-500 h-full transition-all duration-500"
                    style={{ width: `${100 - cobroPercentage}%` }}
                    title={`Pendiente: ${100 - cobroPercentage}%`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-1">
              <Link
                href="/cobros"
                className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-[#0066B3]" />
                Ver Todos los Recibos de Cobro
              </Link>
            </div>
          </div>

          {/* Card 2: Quick Launchpad Operativo */}
          <div className="glass-card p-4 rounded-2xl border border-sky-100 shadow-xs bg-gradient-to-br from-white to-sky-50/30 space-y-2.5">
            <span className="text-[11px] font-black uppercase text-[#0066B3] tracking-wider block">
              Atajos Rápidos de Emisión
            </span>

            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/documentos/nuevo"
                className="p-3 rounded-xl bg-gradient-to-r from-[#0066B3] to-[#004E8A] text-white hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <PlusCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-black group-hover:text-sky-200 transition-colors">
                      Nueva Cotización Técnica
                    </div>
                    <div className="text-[10px] text-sky-100">
                      Líneas de materiales y mano de obra
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-sky-200 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/clientes"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#0066B3] hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0066B3] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 group-hover:text-[#0066B3] transition-colors">
                      Estados de Cuenta de Clientes
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Consulta de balances y facturas pendientes
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: DGII Compliance & Legal Entity */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-xs space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-[#0066B3]" />
              <span>Ficha Fiscal y Regulatoria DGII</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Razón Social:</span>
                <strong className="text-slate-900 text-right truncate max-w-[180px]">
                  {empresa?.nombre_empresa || 'MADELES Electroservicios'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>RNC Oficial:</span>
                <strong className="font-mono text-slate-900">{empresa?.rnc || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Comprobantes:</span>
                <span className="font-semibold text-slate-700">e-CF (E31..E47) / NCF</span>
              </div>
              <div className="flex justify-between">
                <span>Moneda:</span>
                <span className="font-bold text-[#0066B3]">{empresa?.moneda || 'DOP'} (RD$)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Instant Modals */}
      <CobroModal
        factura={selectedFacturaCobro}
        isOpen={isCobroModalOpen}
        onClose={() => {
          setIsCobroModalOpen(false);
          setSelectedFacturaCobro(null);
        }}
        onSuccess={handleModalSuccess}
      />

      <ConvertirModal
        factura={selectedFacturaConvertir}
        isOpen={isConvertirModalOpen}
        onClose={() => {
          setIsConvertirModalOpen(false);
          setSelectedFacturaConvertir(null);
        }}
        onSuccess={handleModalSuccess}
      />
    </motion.div>
  );
}
