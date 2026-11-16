'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Button } from 'antd';
import { ArrowRightOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { Lock, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  rol: string;
  correo?: string;
}

interface DemoAccessContextType {
  isUnlocked: boolean;
  user: AuthUser | null;
  login: (username: string, pass: string) => Promise<boolean>;
  lock: () => void;
  logout: () => void;
}

const DemoAccessContext = createContext<DemoAccessContextType>({
  isUnlocked: true,
  user: null,
  login: async () => true,
  lock: () => {},
  logout: () => {},
});

const DEMO_STORAGE_KEY = 'madeles_demo_authenticated_v1';
const JWT_STORAGE_KEY = 'madeles_jwt_token';
const USER_STORAGE_KEY = 'madeles_user_v1';

export function DemoAccessProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Form states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(DEMO_STORAGE_KEY);
      const storedToken = localStorage.getItem(JWT_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedAuth === 'true' || storedToken) {
        setIsUnlocked(true);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {}
        }
      }
    } catch {
      // LocalStorage not available or restricted
    } finally {
      setMounted(true);
    }
  }, []);

  const handleLogin = async (username: string, pass: string) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await api.login({ username: username.trim(), password: pass });
      if (res && res.accessToken) {
        localStorage.setItem(JWT_STORAGE_KEY, res.accessToken);
        localStorage.setItem(DEMO_STORAGE_KEY, 'true');
        if (res.usuario) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.usuario));
          setUser(res.usuario);
        }
        setIsUnlocked(true);
        setErrorMsg('');
        return true;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Usuario o contraseña incorrectos.';
      setErrorMsg(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  const handleLock = () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      localStorage.removeItem(JWT_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
    setIsUnlocked(false);
    setUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setErrorMsg('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!usernameInput.trim()) {
      setErrorMsg('Por favor ingrese su usuario o correo.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Por favor ingrese su contraseña.');
      return;
    }
    await handleLogin(usernameInput, passwordInput);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <DemoAccessContext.Provider
      value={{
        isUnlocked,
        user,
        login: handleLogin,
        lock: handleLock,
        logout: handleLock,
      }}
    >
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="lock-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 select-none overflow-y-auto"
          >
            {/* Background subtle glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-[#0066B3]/20 via-sky-500/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl text-center space-y-6 my-auto rounded-none">
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-950/80 border border-sky-800/60 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Acceso al Sistema ERP
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Manuel De Jesús Electroservicios
                </h1>
                <p className="text-xs text-slate-400 mt-1.5">
                  Inicie sesión con su usuario y contraseña autorizados
                </p>
              </div>

              {/* Formulario de Inicio de Sesión */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div className="space-y-3 text-left">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                      Usuario o Correo
                    </label>
                    <Input
                      size="large"
                      placeholder="Madele_admin"
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      autoFocus
                      prefix={<UserOutlined className="text-slate-500 mr-1" />}
                      className="h-11 bg-slate-950/70 border-slate-700 text-white font-medium hover:border-sky-500 focus:border-sky-500 rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                      Contraseña
                    </label>
                    <Input.Password
                      size="large"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      prefix={<LockOutlined className="text-slate-500 mr-1" />}
                      className="h-11 bg-slate-950/70 border-slate-700 text-white font-medium hover:border-sky-500 focus:border-sky-500 rounded-none"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-semibold text-rose-400 mt-2 text-center"
                  >
                    {errorMsg}
                  </motion.p>
                )}

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isSubmitting}
                  icon={<ArrowRightOutlined />}
                  className="w-full h-12 bg-[#0066B3] hover:bg-[#004E8A] font-bold text-sm tracking-wide shadow-lg shadow-sky-900/30 rounded-none"
                >
                  Entrar a MADELES ERP
                </Button>

                {/* Acceso oficial Madele_admin */}
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">Usuario oficial:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameInput('Madele_admin');
                        setPasswordInput('Manuel1610');
                      }}
                      className="font-mono font-bold text-amber-400 hover:text-amber-300 underline decoration-amber-400/40 cursor-pointer"
                      title="Haga clic para autocompletar credenciales"
                    >
                      Madele_admin
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

export function useAuth() {
  return useContext(DemoAccessContext);
}
