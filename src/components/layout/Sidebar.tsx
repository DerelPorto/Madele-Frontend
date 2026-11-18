'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatosEmpresa } from '@/services/clientMainService';
import { useDemoAccess } from '@/providers/DemoAccessProvider';
import { useSidebar } from '@/providers/SidebarProvider';
import {
  FileText,
  Users,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Receipt,
  X,
  Hash,
  Lock,
  RotateCcw,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: empresa } = useDatosEmpresa();
  const { lock } = useDemoAccess();
  const { isOpen, close } = useSidebar();

  const [ventasOpen, setVentasOpen] = useState(true);

  const isVentasActive =
    pathname.startsWith('/documentos');

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
      {/* 1. Módulo Principal */}
      <div>
        <Link
          href="/"
          onClick={() => onItemClick && onItemClick()}
          className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all ${pathname === '/'
            ? 'bg-[#0066B3] text-white shadow-md'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0 text-sky-400" />
          <span className="flex-1">Panel Principal</span>
        </Link>
      </div>

      {/* 2. Categoría Cotizaciones y Facturación con Submenús Identificados */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setVentasOpen(!ventasOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-300 hover:text-white bg-slate-900/60 border-l-2 ${isVentasActive ? 'border-l-[#0066B3] text-white' : 'border-l-slate-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#0066B3]" />
            <span>Cotizaciones y Facturación</span>
          </div>
          {ventasOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {ventasOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5 pl-3 border-l border-slate-800/80 my-1 overflow-hidden"
            >
              {/* 1. Nueva Cotización */}
              <Link
                href="/documentos/nuevo"
                onClick={() => onItemClick && onItemClick()}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all ${
                  pathname === '/documentos/nuevo' && searchParams.get('tipo') !== 'E34'
                    ? 'bg-[#0066B3] text-white font-bold'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="flex-1 truncate">Nueva Cotización</span>
              </Link>

              {/* 2. Nota de Crédito */}
              <Link
                href="/documentos/nuevo?tipo=E34"
                onClick={() => onItemClick && onItemClick()}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all ${
                  pathname === '/documentos/nuevo' && searchParams.get('tipo') === 'E34'
                    ? 'bg-[#0066B3] text-white font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="flex-1 truncate">Nota de Crédito</span>
              </Link>

              {/* 3. Bandeja General */}
              <Link
                href="/documentos"
                onClick={() => onItemClick && onItemClick()}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all ${
                  pathname === '/documentos'
                    ? 'bg-[#0066B3] text-white font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                <span className="flex-1 truncate">Bandeja General</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Gestión y Tesorería */}
      <div className="space-y-1 pt-2 border-t border-slate-800/80">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operaciones y Tesorería
        </div>

        <Link
          href="/cobros"
          onClick={() => onItemClick && onItemClick()}
          className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-all ${pathname.startsWith('/cobros')
            ? 'bg-[#0066B3] text-white font-bold'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
        >
          <Receipt className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="flex-1">Cobros y Recibos</span>
        </Link>

        <Link
          href="/clientes"
          onClick={() => onItemClick && onItemClick()}
          className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-all ${pathname.startsWith('/clientes')
            ? 'bg-[#0066B3] text-white font-bold'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
        >
          <Users className="w-4 h-4 shrink-0 text-sky-400" />
          <span className="flex-1">Directorio de Clientes</span>
        </Link>

        <Link
          href="/secuencias-ncf"
          onClick={() => onItemClick && onItemClick()}
          className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-all ${pathname.startsWith('/secuencias-ncf')
            ? 'bg-[#0066B3] text-white font-bold'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
        >
          <Hash className="w-4 h-4 shrink-0 text-purple-400" />
          <span className="flex-1">Secuencias NCF DGII</span>
        </Link>
      </div>
    </nav>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 no-print"
          />

          {/* Menú Lateral Deslizable (Bordes Rectangulares) */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800 shadow-2xl no-print overflow-hidden rounded-none"
          >
            {/* Header de la Barra Lateral */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <Link href="/" onClick={close} className="flex items-center gap-3 group">
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
                  <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 leading-none">
                    {empresa?.nombre_corto || 'MADELES'}
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-widest">
                      ERP
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[140px]">
                    {empresa?.nombre_empresa || 'Electroservicios SRL'}
                  </div>
                </div>
              </Link>

              <button
                onClick={close}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Ocultar menú lateral"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Enlaces de Navegación */}
            {renderNavLinks(close)}

            {/* Pie del Menú con RNC Fiscal y Bloqueo */}
            <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950">
              <div className="bg-slate-900 p-2.5 text-[11px] text-slate-300 space-y-1 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>RNC Fiscal DGII</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Activo</span>
                </div>
                <div className="font-mono font-bold text-white tracking-wider text-xs bg-slate-950 p-1 border border-slate-800 text-center">
                  {empresa?.rnc || '—'}
                </div>
              </div>

              <button
                onClick={() => {
                  close();
                  lock();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 text-xs font-semibold transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear Sesión</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;
