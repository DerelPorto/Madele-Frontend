'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, Button } from 'antd';
import { useDatosEmpresa } from '@/services/clientMainService';
import { useDemoAccess } from '@/providers/DemoAccessProvider';
import {
  FileText,
  Users,
  PlusCircle,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Receipt,
  Menu,
  X,
  Building,
  Phone,
  ArrowRight,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1.5">
      <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Menú Operativo</span>
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
    <>
      {/* 1. Mobile Top Navigation Bar (< lg screen devices) */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between no-print shadow-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066B3] to-amber-400 p-[1.5px] shadow-md shadow-sky-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
              <Image
                src="/logo.png"
                alt="MADELES Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 leading-none">
              {empresa?.nombre_corto || 'MADELES'}
              <span className="px-1 py-0.2 text-[8px] font-extrabold rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ERP
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
              {empresa?.nombre_empresa || 'Electroservicios SRL'}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/documentos/nuevo"
            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
            <span>Nuevo</span>
          </Link>

          <Button
            type="text"
            icon={<Menu className="w-5 h-5 text-white" />}
            onClick={() => setMobileMenuOpen(true)}
            className="text-white hover:bg-slate-800 flex items-center justify-center"
          />
        </div>
      </header>

      {/* 2. Mobile Drawer Navigation (< lg screens) */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="left"
        styles={{
          body: {
            padding: 0,
            background: 'linear-gradient(to bottom, #020617, #0B132B, #020617)',
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
              <p className="text-[10px] text-slate-400 font-normal">
                {empresa?.eslogan || 'Electroservicios SRL'}
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-full justify-between">
          {renderNavLinks(() => setMobileMenuOpen(false))}

          <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
            <div className="bg-slate-900/90 rounded-xl p-3 text-xs text-slate-300 space-y-1.5 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>RNC Fiscal:</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">DGII</span>
              </div>
              <div className="font-mono font-bold text-white text-xs tracking-wider">
                {empresa?.rnc || '—'}
              </div>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                lock();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800/60 hover:border-rose-900/50 text-xs font-semibold transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear Sesión</span>
            </button>
          </div>
        </div>
      </Drawer>

      {/* 3. Desktop Docked Sidebar (>= lg screen devices) */}
      <aside className="hidden lg:flex w-68 bg-gradient-to-b from-slate-950 via-[#071329] to-slate-950 text-slate-100 flex-col shrink-0 min-h-screen border-r border-slate-800/80 shadow-2xl no-print relative z-30 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/2 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <Link href="/" className="flex items-center gap-3.5 group relative z-10">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0066B3] via-sky-500 to-amber-400 p-[1.5px] shadow-xl shadow-sky-900/50 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="MADELES Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>

            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 leading-none">
                {empresa?.nombre_corto || 'MADELES'}
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                  ERP
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1 truncate max-w-[150px]">
                {empresa?.nombre_empresa || 'Electroservicios SRL'}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        {renderNavLinks()}

        {/* Corporate Legal Card & DGII Badge */}
        <div className="p-4 border-t border-slate-800/60 space-y-3">
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 rounded-2xl p-3.5 text-[11px] text-slate-300 space-y-2 border border-slate-800/80 shadow-inner">
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
            onClick={lock}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800/60 hover:border-rose-900/50 text-xs font-semibold transition-all group"
          >
            <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Bloquear Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
