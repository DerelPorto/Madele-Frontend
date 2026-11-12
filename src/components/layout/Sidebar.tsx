'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  Receipt,
  X,
  Hash,
  Lock,
} from 'lucide-react';

const navigation = [
  { name: 'Panel Principal', href: '/', icon: LayoutDashboard },
  { name: 'Cotizaciones y Facturas', href: '/documentos', icon: FileText },
  {
    name: 'Nueva Cotización / Factura',
    href: '/documentos/nuevo',
    icon: PlusCircle,
    highlight: true,
  },
  { name: 'Cobros y Recibos', href: '/cobros', icon: Receipt },
  { name: 'Clientes y Balances', href: '/clientes', icon: Users },
  { name: 'Secuencias NCF', href: '/secuencias-ncf', icon: Hash },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: empresa } = useDatosEmpresa();
  const { lock } = useDemoAccess();
  const { isOpen, close } = useSidebar();

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Módulos del Sistema</span>
        <Sparkles className="w-3 h-3 text-amber-400" />
      </div>

      {navigation.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href ||
              (item.href !== '/' &&
                pathname.startsWith(item.href) &&
                item.href !== '/documentos/nuevo');

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => {
              if (onItemClick) onItemClick();
            }}
            className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-gradient-to-r from-[#0066B3] to-[#004880] rounded-xl shadow-lg shadow-[#0066B3]/40 border border-sky-400/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <item.icon
              className={`w-4 h-4 shrink-0 relative z-10 transition-transform group-hover:scale-110 ${
                isActive
                  ? 'text-white'
                  : item.highlight
                  ? 'text-amber-400'
                  : 'text-slate-400 group-hover:text-sky-400'
              }`}
            />
            <span className="flex-1 truncate relative z-10">{item.name}</span>

            {item.highlight && !isActive && (
              <span className="relative z-10 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs animate-pulse">
                Nuevo
              </span>
            )}

            {isActive && (
              <ChevronRight className="w-3.5 h-3.5 text-white/60 relative z-10" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay: Clic afuera para ocultar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 no-print"
          />

          {/* Menú Lateral Deslizable (Slide-in Sidebar) */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 via-[#071329] to-slate-950 text-slate-100 flex flex-col border-r border-slate-800/80 shadow-2xl no-print overflow-hidden"
          >
            {/* Header de la Barra Lateral con Botón Cerrar */}
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between relative overflow-hidden bg-slate-950/60">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              <Link href="/" onClick={close} className="flex items-center gap-3 group relative z-10">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0066B3] via-sky-500 to-amber-400 p-[1.5px] shadow-lg shadow-sky-900/50 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
                      <Image
                        src="/logo.png"
                        alt="MADELES Logo"
                        width={26}
                        height={26}
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
                </div>

                <div>
                  <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 leading-none">
                    {empresa?.nombre_corto || 'MADELES'}
                    <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                      ERP
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[140px]">
                    {empresa?.nombre_empresa || 'Electroservicios SRL'}
                  </div>
                </div>
              </Link>

              {/* Botón para cerrar / ocultar el menú */}
              <button
                onClick={close}
                className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors relative z-10"
                title="Ocultar menú lateral"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Enlaces de Navegación */}
            {renderNavLinks(close)}

            {/* Pie del Menú con RNC Fiscal y Bloqueo */}
            <div className="p-4 border-t border-slate-800/60 space-y-2.5 bg-slate-950/40">
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 rounded-2xl p-3 text-[11px] text-slate-300 space-y-1.5 border border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>RNC Fiscal DGII</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Activo
                  </span>
                </div>
                <div className="font-mono font-bold text-white tracking-wider text-xs bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/60 text-center">
                  {empresa?.rnc || '—'}
                </div>
              </div>

              <button
                onClick={() => {
                  close();
                  lock();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800/60 hover:border-rose-900/50 text-xs font-semibold transition-all group"
              >
                <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
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
