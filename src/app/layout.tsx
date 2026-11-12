import React from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import QueryProvider from '@/providers/QueryProvider';
import AntdProvider from '@/providers/AntdProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { DemoAccessProvider } from '@/providers/DemoAccessProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'MADELES SRL - Manuel De Jesús Electroservicios',
  description:
    'Sistema ERP comercial y de facturación oficial para Manuel De Jesús Electroservicios SRL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`h-full ${jakarta.variable}`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-slate-100 text-slate-900 selection:bg-[#0066B3] selection:text-white">
        <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium">Cargando MADELES ERP...</div>}>
          <QueryProvider>
            <AntdProvider>
              <ToastProvider>
                <DemoAccessProvider>
                  <div className="flex min-h-screen w-full app-mesh-bg">
                    <Sidebar />
                    <div className="flex-1 flex flex-col min-w-0">
                      <TopHeader />
                      <main className="flex-1 w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-5">
                        {children}
                      </main>
                    </div>
                  </div>
                </DemoAccessProvider>
              </ToastProvider>
            </AntdProvider>
          </QueryProvider>
        </React.Suspense>
      </body>
    </html>
  );
}
