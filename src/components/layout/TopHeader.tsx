'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip } from 'antd';
import { useDatosEmpresa, useDashboardKpis } from '@/services/clientMainService';
import { useDemoAccess } from '@/providers/DemoAccessProvider';
import { formatDOP } from '@/lib/utils';
import {
  PlusCircle,
  ShieldCheck,
  Clock,
  FileText,
  Lock,
  ChevronRight,
  Sparkles,
  Zap,
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
    <header className="hidden lg:flex sticky top-0 z-20 w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 items-center justify-between no-print shadow-sm">
      {/* Left: Dynamic Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">
              {pageInfo.title}
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-sky-500/15 text-sky-300 border border-sky-400/25">
              TesteCF
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[380px]">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: KPI Summary, Quick Actions & Session */}
      <div className="flex items-center gap-3.5">
        {/* KPI: Por Cobrar */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium">Por Cobrar:</span>
          <span className="font-mono font-bold text-white text-xs">
            {formatDOP(totalPendiente)}
          </span>
        </div>

        {/* KPI: Cotizaciones Activas */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <FileText className="w-3.5 h-3.5 text-[#0066B3] shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium">Cotizaciones:</span>
          <span className="font-mono font-black text-white text-xs">
            {cotizacionesActivas}
          </span>
        </div>

        {/* Quick Button: Nuevo Documento */}
        {pathname !== '/documentos/nuevo' && (
          <Link
            href="/documentos/nuevo"
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all group"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-90 transition-transform" />
            <span>Nuevo Documento</span>
          </Link>
        )}

        {/* Lock Session */}
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
