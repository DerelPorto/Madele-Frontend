'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, Button, Tooltip } from 'antd';
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
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  Lock,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cotizaciones y Facturas', href: '/documentos', icon: FileText },
  { name: 'Recibos de Cobro', href: '/cobros', icon: Receipt },
  { name: 'Directorio de Clientes', href: '/clientes', icon: Users },
];

export function TopNavbar() {
  const pathname = usePathname();
  const { lock } = useDemoAccess();
  const { data: empresa } = useDatosEmpresa();
  const { data: kpis } = useDashboardKpis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalPendiente = Number(kpis?.total_pendiente_cobro) || 0;
  const cotizacionesActivas = kpis?.cantidad_cotizaciones_activas ?? 0;

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-xl no-print select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0066B3] via-sky-500 to-amber-400 p-[1.5px] shadow-lg shadow-sky-900/40 group-hover:scale-105 transition-transform duration-300">
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
                <div className="font-black text-base tracking-tight text-white flex items-center gap-1.5 leading-none">
                  <span>{empresa?.nombre_corto || 'MADELES'}</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                    ERP
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] sm:max-w-[200px] mt-0.5">
                  {empresa?.nombre_empresa || 'Electroservicios SRL'}
                </div>
              </div>
            </Link>

            {/* Linear-style Ticker Divider (Hidden on mobile) */}
            <div className="hidden xl:flex items-center gap-3 pl-4 border-l border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/50 text-[11px] font-mono font-bold text-sky-300">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Por Cobrar:</span>
                <span className="text-white">{formatDOP(totalPendiente)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300">
                <FileText className="w-3 h-3 text-[#0066B3]" />
                <span>Cotizaciones:</span>
                <span className="text-amber-400">{cotizacionesActivas}</span>
              </div>
            </div>
          </div>

          {/* Center: Desktop Horizontal Navigation Tabs (Linear / Vercel style) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
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
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 z-10 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="topNavTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#0066B3] to-[#004880] rounded-xl shadow-md shadow-[#0066B3]/40 border border-sky-400/30"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`w-3.5 h-3.5 relative z-10 ${
                      isActive ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  />
                  <span className="relative z-10 tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions & DGII Legal Badge */}
          <div className="flex items-center gap-3 shrink-0">
            {/* DGII Legal Pill (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] font-mono font-medium text-slate-400">
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
                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-800 flex items-center justify-center"
              >
                <Lock className="w-4 h-4" />
              </button>
            </Tooltip>

            {/* Quick Action Button */}
            <Link
              href="/documentos/nuevo"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
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
            background: 'linear-gradient(to bottom, #020617, #0B132B)',
            color: '#F8FAFC',
          },
          header: {
            background: '#020617',
            borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
          },
        }}
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066B3] to-amber-400 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1">
                <Image
                  src="/logo.png"
                  alt="MADELES Logo"
                  width={22}
                  height={22}
                  className="object-contain"
                />
              </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0066B3] text-white shadow-md'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
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
