'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('❌ [Madele ERP Global Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-8 sm:p-10 text-center shadow-xl space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center justify-center p-3 bg-rose-50 border border-rose-200 text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>

        <div>
          <span className="inline-block px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
            Ha ocurrido un problema inesperado
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Error en la aplicación
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            El sistema encontró una excepción al procesar la solicitud. Los datos de su sesión y registros se mantienen seguros.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-slate-50 border border-slate-200 text-left">
            <p className="text-[11px] font-mono text-slate-700 break-all">
              <span className="font-bold text-slate-900">Detalle técnico: </span>
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Digest ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0066B3] hover:bg-[#004E8A] text-white font-bold text-xs h-11 px-5 shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar operación
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs h-11 px-5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Ir al Panel Principal
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          <span>MADELES ERP • Manuel De Jesús Electroservicios SRL • RNC 131-042961</span>
        </div>
      </div>
    </div>
  );
}
