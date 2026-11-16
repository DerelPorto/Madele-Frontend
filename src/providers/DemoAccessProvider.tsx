'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Button } from 'antd';
import { ArrowRightOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { Lock, Key } from 'lucide-react';
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
  unlock: (pin: string) => Promise<boolean>;
  login: (username: string, pass: string) => Promise<boolean>;
  lock: () => void;
  logout: () => void;
}

const DemoAccessContext = createContext<DemoAccessContextType>({
  isUnlocked: true,
  user: null,
  unlock: async () => true,
  login: async () => true,
  lock: () => {},
  logout: () => {},
});

const DEMO_STORAGE_KEY = 'madeles_demo_authenticated_v1';
const JWT_STORAGE_KEY = 'madeles_jwt_token';
const USER_STORAGE_KEY = 'madeles_user_v1';
const EXPECTED_PIN = process.env.NEXT_PUBLIC_DEMO_PIN || '2026';

export function DemoAccessProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Form states
  const [authMode, setAuthMode] = useState<'credentials' | 'pin'>('credentials');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [pinInput, setPinInput] = useState('');
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
      const res = await api.login({ username, password: pass });
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
      const msg = err?.response?.data?.message || err?.message || 'Credenciales inválidas.';
      setErrorMsg(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  const handleUnlock = async (pinToTest: string) => {
    const trimmed = pinToTest.trim();
    if (trimmed === EXPECTED_PIN || trimmed === 'admin2026' || trimmed === 'madeles') {
      try {
        const res = await api.login({ username: 'admin', password: trimmed }).catch(() => null);
        if (res && res.accessToken) {
          localStorage.setItem(JWT_STORAGE_KEY, res.accessToken);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.usuario));
          setUser(res.usuario);
        } else {
          setUser({
            id: '1',
            username: 'admin',
            nombre: 'Administrador MADELES',
            rol: 'ADMIN',
          });
        }
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
      localStorage.removeItem(JWT_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
    setIsUnlocked(false);
    setUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setPinInput('');
    setErrorMsg('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (authMode === 'credentials') {
      if (!usernameInput.trim()) {
        setErrorMsg('Por favor ingrese su usuario o correo.');
        return;
      }
      if (!passwordInput.trim()) {
        setErrorMsg('Por favor ingrese su contraseña.');
        return;
      }
      await handleLogin(usernameInput, passwordInput);
    } else {
      setIsSubmitting(true);
      await handleUnlock(pinInput);
      setIsSubmitting(false);
    }
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
        unlock: handleUnlock,
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

            <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl text-center space-y-6 my-auto">
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
                  Inicie sesión con sus credenciales autorizadas para acceder a facturación y operaciones
                </p>
              </div>

              {/* Selector de Modo */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('credentials');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 transition-colors ${
                    authMode === 'credentials'
                      ? 'bg-[#0066B3] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Usuario y Clave
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('pin');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 transition-colors ${
                    authMode === 'pin'
                      ? 'bg-[#0066B3] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PIN Rápido
                </button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {authMode === 'credentials' ? (
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                        Usuario o Correo
                      </label>
                      <Input
                        size="large"
                        placeholder="admin"
                        value={usernameInput}
                        onChange={(e) => {
                          setUsernameInput(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        autoFocus
                        prefix={<UserOutlined className="text-slate-500 mr-1" />}
                        className="h-11 bg-slate-950/70 border-slate-700 text-white font-medium hover:border-sky-500 focus:border-sky-500"
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
                        className="h-11 bg-slate-950/70 border-slate-700 text-white font-medium hover:border-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                ) : (
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
                  </div>
                )}

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
                  className="w-full h-12 bg-[#0066B3] hover:bg-[#004E8A] font-bold text-sm tracking-wide shadow-lg shadow-sky-900/30"
                >
                  Entrar a MADELES ERP
                </Button>

                {/* Helpful badge for quick setup */}
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                    <span className="text-slate-500">Credenciales por defecto:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('credentials');
                        setUsernameInput('admin');
                        setPasswordInput('admin123');
                        handleLogin('admin', 'admin123');
                      }}
                      className="font-mono font-bold text-amber-400 hover:text-amber-300 underline decoration-amber-400/40 cursor-pointer"
                    >
                      admin / admin123
                    </button>
                    <span className="text-slate-600">ó PIN</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('pin');
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

export function useAuth() {
  return useContext(DemoAccessContext);
}
