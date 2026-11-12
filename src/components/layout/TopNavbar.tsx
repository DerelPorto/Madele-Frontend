'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Drawer, Button, Tooltip, Dropdown } from 'antd';
import { useDatosEmpresa, useDashboardKpis } from '@/services/clientMainService';
import { useDemoAccess } from '@/providers/DemoAccessProvider';
import { formatDOP } from '@/lib/utils';
import {
  FileText,
  Users,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  Receipt,
  Menu,
  Clock,
  Lock,
  Hash,
  ChevronDown,
  FileSpreadsheet,
  FileCheck,
  Zap,
  RotateCcw,
} from 'lucide-react';

const documentosMenuItems = [
  {
    key: 'todas',
    label: (
      <Link href="/documentos" className="flex items-center gap-2.5 py-1 text-xs font-semibold text-slate-800 hover:text-[#0066B3]">
        <FileText className="w-3.5 h-3.5 text-[#0066B3]" />
        <span>Bandeja General (Todas)</span>
      </Link>
    ),
  },
  {
    key: 'cotizaciones',
    label: (
      <Link href="/documentos?tab=COTIZACION" className="flex items-center gap-2.5 py-1 text-xs font-semibold text-slate-800 hover:text-amber-600">
        <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
        <span>Ver Cotizaciones</span>
      </Link>
    ),
  },
  {
    key: 'facturas',
    label: (
      <Link href="/documentos?tab=FACTURAS" className="flex items-center gap-2.5 py-1 text-xs font-semibold text-slate-800 hover:text-emerald-600">
        <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Ver Facturas Fiscales</span>
      </Link>
    ),
  },
  { type: 'divider' as const },
  {
    key: 'nueva-cotizacion',
    label: (
      <Link href="/documentos/nuevo?modo=COTIZACION" className="flex items-center gap-2.5 py-1 text-xs font-bold text-amber-600 hover:text-amber-700">
        <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
        <span>+ Nueva Cotización</span>
      </Link>
    ),
  },
  {
    key: 'nueva-factura',
    label: (
      <Link href="/documentos/nuevo?modo=FACTURA_DIRECTA" className="flex items-center gap-2.5 py-1 text-xs font-bold text-[#0066B3] hover:text-[#004E8A]">
        <Zap className="w-3.5 h-3.5 text-sky-500" />
        <span>+ Emitir Factura Fiscal</span>
      </Link>
    ),
  },
  {
    key: 'nueva-nc',
    label: (
      <Link href="/documentos/nuevo?tipo=E34" className="flex items-center gap-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900">
        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
        <span>+ Nota de Crédito (E34)</span>
      </Link>
    ),
  },
];

export function TopNavbar() {
  const pathname = usePathname();
  const { lock } = useDemoAccess();
  const { data: empresa } = useDatosEmpresa();
  const { data: kpis } = useDashboardKpis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalPendiente = Number(kpis?.total_pendiente_cobro) || 0;
  const cotizacionesActivas = kpis?.cantidad_cotizaciones_activas ?? 0;

  const isDocsActive = pathname.startsWith('/documentos');

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950 border-b border-slate-800 text-white shadow-xl no-print select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="MADELES Logo"
                  width={36}
                  height={36}
                  className="object-contain w-9 h-9"
                  priority
                />
              </div>

              <div>
                <div className="font-black text-base tracking-tight text-white flex items-center gap-1.5 leading-none">
                  <span>{empresa?.nombre_corto || 'MADELES'}</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-widest">
                    ERP
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] sm:max-w-[200px] mt-0.5">
                  {empresa?.nombre_empresa || 'Electroservicios SRL'}
                </div>
              </div>
            </Link>

            {/* Quick Metrics Divider */}
            <div className="hidden xl:flex items-center gap-3 pl-4 border-l border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/60 border border-sky-800/50 text-[11px] font-mono font-bold text-sky-300">
                <Clock className="w-3 h-3 text-sky-300" />
                <span>Por Cobrar:</span>
                <span className="text-white">{formatDOP(totalPendiente)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300">
                <FileText className="w-3 h-3 text-[#0066B3]" />
                <span>Cotizaciones:</span>
                <span className="text-white font-black">{cotizacionesActivas}</span>
              </div>
            </div>
          </div>

          {/* Center: Desktop Horizontal Navigation Tabs with Submenus */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 border border-slate-800 shadow-inner">
            {/* Dashboard */}
            <Link
              href="/"
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all z-10 ${
                pathname === '/'
                  ? 'bg-[#0066B3] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            {/* Cotizaciones y Facturación (Con Dropdown Submenú Identificado) */}
            <Dropdown menu={{ items: documentosMenuItems }} placement="bottom" trigger={['hover', 'click']}>
              <button
                type="button"
                className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all z-10 cursor-pointer ${
                  isDocsActive
                    ? 'bg-[#0066B3] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Cotizaciones y Facturas</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </Dropdown>

            {/* Recibos de Cobro */}
            <Link
              href="/cobros"
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all z-10 ${
                pathname.startsWith('/cobros')
                  ? 'bg-[#0066B3] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Recibos de Cobro</span>
            </Link>

            {/* Directorio de Clientes */}
            <Link
              href="/clientes"
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all z-10 ${
                pathname.startsWith('/clientes')
                  ? 'bg-[#0066B3] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directorio de Clientes</span>
            </Link>

            {/* Secuencias NCF */}
            <Link
              href="/secuencias-ncf"
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all z-10 ${
                pathname.startsWith('/secuencias-ncf')
                  ? 'bg-[#0066B3] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Secuencias NCF</span>
            </Link>
          </nav>

          {/* Right: Actions & DGII Legal Badge */}
          <div className="flex items-center gap-3 shrink-0">
            {/* DGII Legal Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[11px] font-mono font-medium text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>RNC:</span>
              <strong className="text-white font-bold">{empresa?.rnc || '—'}</strong>
            </div>

            {/* Lock session button */}
            <Tooltip title="Bloquear demostración">
              <button
                type="button"
                onClick={lock}
                aria-label="Bloquear demostración"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-800 flex items-center justify-center"
              >
                <Lock className="w-4 h-4" />
              </button>
            </Tooltip>

            {/* Quick Action Button */}
            <Link
              href="/documentos/nuevo"
              className="px-4 py-2 bg-[#0066B3] hover:bg-[#004E8A] text-white font-black text-xs shadow-md shadow-[#0066B3]/30 flex items-center gap-1.5 transition-all border border-sky-400/30"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Nueva Cotización / Factura</span>
              <span className="sm:hidden">Nuevo</span>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              type="text"
              icon={<Menu className="w-5 h-5 text-white" />}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-white hover:bg-slate-800 flex items-center justify-center p-2"
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="top"
        height="auto"
        styles={{
          body: {
            padding: '1.25rem',
            background: '#020617',
            color: '#F8FAFC',
          },
          header: {
            background: '#020617',
            borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
          },
        }}
        title={
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="MADELES Logo"
                width={28}
                height={28}
                className="object-contain w-7 h-7"
              />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white">
                {empresa?.nombre_corto || 'MADELES'} ERP
              </span>
              <p className="text-[10px] text-slate-400">
                {empresa?.nombre_empresa || 'Electroservicios SRL'}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-2.5 text-xs font-bold transition-all ${
                pathname === '/' ? 'bg-[#0066B3] text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {/* Submenús de Cotización y Facturación en Móvil */}
            <div className="p-2.5 bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-[#0066B3]">
                Cotizaciones y Facturación
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/documentos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-slate-950 text-slate-300 text-[11px] font-medium"
                >
                  Bandeja General
                </Link>
                <Link
                  href="/documentos?tab=COTIZACION"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-slate-950 text-amber-300 text-[11px] font-medium"
                >
                  Cotizaciones
                </Link>
                <Link
                  href="/documentos?tab=FACTURAS"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-slate-950 text-sky-300 text-[11px] font-medium"
                >
                  Facturas Fiscales
                </Link>
                <Link
                  href="/documentos/nuevo?modo=COTIZACION"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-amber-950/40 text-amber-200 text-[11px] font-bold"
                >
                  + Nueva Cotización
                </Link>
                <Link
                  href="/documentos/nuevo?modo=FACTURA_DIRECTA"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-sky-950/40 text-sky-200 text-[11px] font-bold"
                >
                  + Emitir Factura
                </Link>
                <Link
                  href="/documentos/nuevo?tipo=E34"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-slate-950 text-slate-300 text-[11px] font-medium"
                >
                  + Nota Crédito E34
                </Link>
              </div>
            </div>

            <Link
              href="/cobros"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-2.5 text-xs font-bold transition-all ${
                pathname.startsWith('/cobros') ? 'bg-[#0066B3] text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Recibos de Cobro</span>
            </Link>

            <Link
              href="/clientes"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-2.5 text-xs font-bold transition-all ${
                pathname.startsWith('/clientes') ? 'bg-[#0066B3] text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Directorio de Clientes</span>
            </Link>

            <Link
              href="/secuencias-ncf"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-2.5 text-xs font-bold transition-all ${
                pathname.startsWith('/secuencias-ncf') ? 'bg-[#0066B3] text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Secuencias NCF</span>
            </Link>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>RNC Fiscal DGII:</span>
            </div>
            <strong className="text-white font-mono">{empresa?.rnc || '—'}</strong>
          </div>
        </div>
      </Drawer>
    </header>
  );
}

export default TopNavbar;
