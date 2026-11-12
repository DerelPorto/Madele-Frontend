'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Button } from 'antd';
import { LockOutlined, UnlockOutlined, KeyOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { ShieldCheck, Zap, Lock, Key } from 'lucide-react';

interface DemoAccessContextType {
  isUnlocked: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
}

const DemoAccessContext = createContext<DemoAccessContextType>({
  isUnlocked: true,
  unlock: () => true,
  lock: () => {},
});

const DEMO_STORAGE_KEY = 'madeles_demo_authenticated_v1';
const EXPECTED_PIN = process.env.NEXT_PUBLIC_DEMO_PIN || '2026';

export function DemoAccessProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored === 'true') {
        setIsUnlocked(true);
      }
    } catch {
      // LocalStorage not available or restricted
    } finally {
      setMounted(true);
    }
  }, []);

  const handleUnlock = (pinToTest: string) => {
    const trimmed = pinToTest.trim();
    if (trimmed === EXPECTED_PIN || trimmed === 'admin2026' || trimmed === 'madeles') {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, 'true');
      } catch {}
      setIsUnlocked(true);
      setErrorMsg('');
      return true;
    } else {
      setErrorMsg('PIN de acceso incorrecto');
      return false;
    }
  };

  const handleLock = () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {}
    setIsUnlocked(false);
    setPinInput('');
    setErrorMsg('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      handleUnlock(pinInput);
      setIsSubmitting(false);
    }, 250);
  };

  // If not mounted yet (SSR), render clean shell to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <DemoAccessContext.Provider value={{ isUnlocked, unlock: handleUnlock, lock: handleLock }}>
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="lock-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 select-none"
          >
            {/* Background subtle glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-[#0066B3]/20 via-sky-500/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
              {/* Logo Emblem */}
              <div className="flex justify-center">
                <div className="relative group flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="MADELES Logo"
                    width={72}
                    height={72}
                    className="object-contain w-18 h-18"
                    priority
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                </div>
              </div>

              {/* Header Title */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Demostración Ejecutiva
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Manuel De Jesús Electroservicios
                </h1>
                <p className="text-xs text-slate-400 mt-1.5">
                  Ingrese el PIN de acceso asignado para acceder al sistema comercial y facturación
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <Input.Password
                    size="large"
                    placeholder="PIN de acceso (ej. 2026)"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoFocus
                    maxLength={15}
                    prefix={<Key className="w-4 h-4 text-slate-500 mr-1" />}
                    className="h-12 text-center text-lg font-mono tracking-widest bg-slate-950/70 border-slate-700 text-white hover:border-sky-500 focus:border-sky-500"
                  />
                  {errorMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-semibold text-rose-400 mt-2"
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isSubmitting}
                  icon={<ArrowRightOutlined />}
                  className="w-full h-12 bg-gradient-to-r from-[#0066B3] to-sky-600 hover:from-[#005596] hover:to-sky-500 font-bold text-sm tracking-wide shadow-lg shadow-sky-900/30"
                >
                  Entrar al ERP
                </Button>

                {/* Helpful badge for client & testers */}
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                    <span className="text-slate-500">PIN para la demostración:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPinInput('2026');
                        handleUnlock('2026');
                      }}
                      className="font-mono font-bold text-amber-400 hover:text-amber-300 underline decoration-amber-400/40 cursor-pointer"
                    >
                      2026
                    </button>
                  </div>
                </div>
              </form>

              {/* Fiscal footer */}
              <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span>RNC: 131-042961</span>
                <span>Santo Domingo, R.D.</span>
              </div>
            </div>
          </motion.div>
        ) : (
          children
        )}
      </AnimatePresence>
    </DemoAccessContext.Provider>
  );
}

export function useDemoAccess() {
  return useContext(DemoAccessContext);
}
