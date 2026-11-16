'use client';

import React from 'react';
import Link from 'next/link';
import { Home, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-8 sm:p-10 text-center shadow-xl space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center justify-center p-4 bg-sky-50 border border-sky-200 text-[#0066B3]">
            <FileQuestion className="w-10 h-10" />
          </div>
        </div>

        <div>
          <span className="inline-block px-2.5 py-1 bg-sky-100 text-[#0066B3] text-xs font-bold uppercase tracking-wider mb-2">
            Código 404
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Página o recurso no encontrado
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            La dirección a la que intenta acceder no existe, fue movida o no tiene permisos suficientes para visualizarla.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066B3] hover:bg-[#004E8A] text-white font-bold text-xs shadow-md transition-colors"
          >
            <Home className="w-4 h-4" />
            Volver al Panel Principal
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          <span>MADELES ERP • Manuel De Jesús Electroservicios SRL</span>
        </div>
      </div>
    </div>
  );
}
