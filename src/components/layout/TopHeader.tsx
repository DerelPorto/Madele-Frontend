'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Tooltip } from 'antd';
import { useDatosEmpresa, useDashboardKpis } from '@/services/clientMainService';
import { useDemoAccess } from '@/providers/DemoAccessProvider';
import { useSidebar } from '@/providers/SidebarProvider';
import { formatDOP } from '@/lib/utils';
import {
  Menu,
  PlusCircle,
  Clock,
  FileText,
  Lock,
} from 'lucide-react';

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Panel Principal',
    subtitle: 'Resumen ejecutivo de operaciones, ingresos y facturación',
  },
  '/documentos': {
    title: 'Cotizaciones y Facturas',
    subtitle: 'Gestión integral de documentos comerciales y comprobantes fiscales',
  },
  '/documentos/nuevo': {
    title: 'Nuevo Documento',
    subtitle: 'Emisión directa de cotización o factura con timbrado DGII',
  },
  '/cobros': {
    title: 'Recibos y Cobros',
    subtitle: 'Control de pagos recibidos, saldos pendientes y recibos oficiales',
  },
  '/clientes': {
    title: 'Directorio de Clientes',
    subtitle: 'Gestión de cartera, condiciones fiscales y estados de cuenta',
  },
  '/secuencias-ncf': {
    title: 'Secuencias NCF y Lotes e-CF',
    subtitle: 'Control de rangos y lotes de comprobantes fiscales autorizados DGII',
  },
};

export function TopHeader() {
  const pathname = usePathname();
  const { lock } = useDemoAccess();
  const { data: empresa } = useDatosEmpresa();
  const { data: kpis } = useDashboardKpis();
  const { isOpen, toggle } = useSidebar();

  const totalPendiente = Number(kpis?.total_pendiente_cobro) || 0;
  const cotizacionesActivas = kpis?.cantidad_cotizaciones_activas ?? 0;

  // Resolve current page title based on pathname
  let pageInfo = routeTitles[pathname];
  if (!pageInfo) {
    if (pathname.startsWith('/documentos/')) {
      pageInfo = {
        title: 'Detalle de Documento',
        subtitle: 'Consulta, impresión y timbrado electrónico de comprobante',
      };
    } else {
      pageInfo = {
        title: 'Sistema ERP Comercial',
        subtitle: 'Manuel De Jesús Electroservicios SRL',
      };
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between no-print shadow-md">
      {/* Left: Botón de Menú Lateral + Identidad y Título */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Botón para abrir / conmutar el Menú Lateral */}
        <button
          onClick={toggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 group shadow-sm ${isOpen
            ? 'bg-[#0066B3] text-white border-sky-400/40 shadow-md shadow-[#0066B3]/30'
            : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800 hover:border-sky-500/40'
            }`}
          title={isOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
        >
          <Menu
            className={`w-4 h-4 transition-transform group-hover:scale-110 ${isOpen ? 'text-white' : 'text-sky-400'
              }`}
          />
        </button>

        <div className="hidden sm:block h-5 w-[1px] bg-slate-800/80" />

        {/* Identidad de marca y Título de la sección */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066B3] via-sky-500 to-amber-400 p-[1.5px] shadow-sm shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
              <Image
                src="/logo.png"
                alt="MADELES Logo"
                width={20}
                height={20}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 leading-none">
              <span className="font-extrabold text-xs text-white tracking-tight">
                {empresa?.nombre_corto || 'MADELES'}
              </span>
              <span className="text-[9px] text-slate-500">•</span>
              <h1 className="text-xs font-bold text-slate-200 tracking-tight">
                {pageInfo.title}
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[260px] md:max-w-[360px] mt-0.5">
              {pageInfo.subtitle}
            </p>
          </div>
        </Link>
      </div>

      {/* Right: KPIs, Quick Actions & Lock Session */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* KPI: Por Cobrar (Visible desde tablets) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium">Por Cobrar:</span>
          <span className="font-mono font-bold text-white text-xs">
            {formatDOP(totalPendiente)}
          </span>
        </div>

        {/* KPI: Cotizaciones Activas (Visible en pantallas grandes) */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <FileText className="w-3.5 h-3.5 text-[#0066B3] shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium">Cotizaciones:</span>
          <span className="font-mono font-black text-white text-xs">
            {cotizacionesActivas}
          </span>
        </div>

        {/* Botón directo: Nuevo Documento */}
        {pathname !== '/documentos/nuevo' && (
          <Link
            href="/documentos/nuevo"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all group"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-90 transition-transform" />
            <span className="hidden sm:inline">Nuevo Documento</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        )}

        {/* Bloquear Sesión */}
        <Tooltip title="Bloquear demostración">
          <button
            onClick={lock}
            aria-label="Bloquear demostración"
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
