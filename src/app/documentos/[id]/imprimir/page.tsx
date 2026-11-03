'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';
import { useDatosEmpresa } from '@/services/clientMainService';
import { formatDOP, formatDate } from '@/lib/utils';
import { ConvertirModal } from '@/components/documentos/ConvertirModal';
import { CobroModal } from '@/components/documentos/CobroModal';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { Button, Tag, Tooltip } from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DollarCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  Printer,
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

function ImprimirContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);

  const { data: empresa } = useDatosEmpresa();

  const { data: factura, isLoading, error, refetch } = useQuery({
    queryKey: ['factura', id],
    queryFn: () => api.getFactura(id),
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleConversionSuccess = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0066B3', '#F59E0B', '#10B981'],
      });
    } catch {}
    queryClient.invalidateQueries({ queryKey: ['factura', id] });
    queryClient.invalidateQueries({ queryKey: ['facturas'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    refetch();
  };

  const handleCobroSuccess = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#0066B3', '#F59E0B'],
      });
    } catch {}
    queryClient.invalidateQueries({ queryKey: ['factura', id] });
    queryClient.invalidateQueries({ queryKey: ['facturas'] });
    queryClient.invalidateQueries({ queryKey: ['cobros'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <MadeleLoader
          size="lg"
          text="Cargando documento oficial de MADELES..."
          subtext="Generando formato oficial para impresión"
        />
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-600 font-bold text-base">Documento no encontrado</div>
        <Link
          href="/documentos"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Documentos
        </Link>
      </div>
    );
  }

  const isCotizacion = factura.estado === 'COTIZACION' || factura.estado === 'BORRADOR';
  const isPaid = factura.estado === 'PAGADA';
  const detalles = (factura.factura_detalles || []).filter(
    (d) => d.descripcion?.trim() || Number(d.precio_unitario) > 0,
  );
  const cliente = factura.clientes;

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-6 flex flex-col items-center print:bg-white print:p-0">
      {/* Top Floating Action Bar (Hidden in Print) */}
      <div className="w-full max-w-[850px] mb-5 flex flex-wrap items-center justify-between gap-3 no-print bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/documentos">
            <Button icon={<ArrowLeftOutlined />} shape="circle" size="middle" />
          </Link>
          <div>
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>{isCotizacion ? 'Cotización Técnica' : 'Factura Fiscal'}</span>
              <span className="font-mono text-[#0066B3] font-black">
                #{isCotizacion ? factura.numero_cotizacion || factura.id : factura.numero_factura || factura.id}
              </span>
              <Tag color={isCotizacion ? 'blue' : isPaid ? 'green' : 'gold'} className="font-bold">
                {factura.estado}
              </Tag>
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[260px] sm:max-w-[400px]">
              {cliente?.nombre_razon_social || 'Cliente'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Button (Only for Quotations or Drafts) */}
          {isCotizacion && (
            <Link href={`/documentos/${factura.id}/editar`}>
              <Button icon={<EditOutlined />} size="middle" className="font-semibold rounded-xl">
                Editar
              </Button>
            </Link>
          )}

          {/* Convert to Invoice Button (if Quote) */}
          {isCotizacion && (
            <Button
              type="primary"
              size="middle"
              icon={<ArrowRightOutlined />}
              onClick={() => setIsConvertModalOpen(true)}
              className="bg-[#0066B3] hover:bg-[#004E8A] font-bold rounded-xl"
            >
              Convertir a Factura
            </Button>
          )}

          {/* Record Payment Button (if Pending Invoice) */}
          {!isCotizacion && Number(factura.saldo_pendiente) > 0 && (
            <Button
              type="primary"
              size="middle"
              icon={<DollarCircleOutlined />}
              onClick={() => setIsCobroModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl"
            >
              Registrar Cobro
            </Button>
          )}

          {/* Print Button */}
          <Button
            type="primary"
            size="middle"
            icon={<PrinterOutlined className="text-amber-400" />}
            onClick={handlePrint}
            className="bg-slate-950 hover:bg-black font-extrabold rounded-xl shadow-md"
          >
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Official MADELES Printable Sheet (Standard Letter Format) */}
      <div className="w-full flex justify-center pb-8 print:p-0 print:pb-0">
        <div className="print-page w-full max-w-[850px] bg-white text-slate-900 shadow-xl rounded-2xl p-6 sm:p-10 relative flex flex-col justify-between border border-slate-200 print:shadow-none print:border-none print:p-0 print:rounded-none">
          {/* Paid Stamp */}
          {isPaid && (
            <div className="absolute right-8 top-44 border-4 border-emerald-600/35 text-emerald-700/40 font-black text-3xl uppercase px-5 py-1.5 rounded-2xl rotate-[-12deg] pointer-events-none select-none">
              PAGADA • TOTAL
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Header: Brand + Document Fiscal Data */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-[#0066B3]">
              {/* Left Brand Details */}
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden bg-slate-50 border border-slate-200">
                  <Image
                    src="/logo.png"
                    alt="MADELES Logo"
                    width={52}
                    height={52}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-[#004E8A] tracking-tight leading-snug">
                    {empresa?.nombre_empresa || 'Manuel De Jesús Electroservicios SRL.'}
                  </h1>
                  <p className="text-[11px] italic text-slate-500 font-medium">
                    {empresa?.eslogan || 'Con responsabilidad y compromiso en cada servicio.'}
                  </p>
                  <div className="text-[10px] text-slate-600 font-mono mt-1 space-y-0.5">
                    <div>
                      RNC Oficial: <strong>{empresa?.rnc || '131-042961'}</strong> • Registro Nacional
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Document Fiscal Box */}
              <div className="text-left sm:text-right shrink-0 min-w-[210px] space-y-1">
                <div className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  {isCotizacion ? 'COTIZACIÓN' : 'FACTURA FISCAL'}
                </div>
                <div className="text-xs font-mono font-black text-[#0066B3]">
                  {isCotizacion ? 'N.º COTIZACIÓN:' : 'N.º FACTURA:'}{' '}
                  {isCotizacion
                    ? factura.numero_cotizacion || factura.id
                    : factura.numero_factura || factura.id}
                </div>
                {!isCotizacion && factura.numero_comprobante && (
                  <div className="inline-block px-2 py-0.5 rounded bg-sky-50 border border-sky-300 text-xs font-mono font-black text-[#004E8A]">
                    NCF: {factura.numero_comprobante}
                  </div>
                )}
                <div className="text-[11px] font-mono text-slate-600 pt-0.5">
                  <span>Fecha Emisión:</span>{' '}
                  <strong className="text-slate-900">{formatDate(factura.fecha_emision)}</strong>
                </div>
                <div className="text-[11px] font-mono text-slate-600">
                  <span>Fecha Vencimiento:</span>{' '}
                  <strong className="text-slate-900">{formatDate(factura.fecha_vencimiento)}</strong>
                </div>
              </div>
            </div>

            {/* 2. Client Information Grid */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 avoid-break">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#0066B3] mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#0066B3]" />
                DATOS DEL CLIENTE / RECEPTOR
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Razón Social / Nombre:</span>
                  <div className="font-bold text-slate-900 text-sm leading-tight">
                    {cliente?.nombre_razon_social || 'Cliente'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Atención / Contacto:</span>
                  <div className="font-semibold text-slate-800">
                    {cliente?.persona_contacto || 'Departamento de Compras / Mantenimiento'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">RNC / Cédula:</span>
                  <div className="font-mono font-bold text-slate-900">
                    {cliente?.documento_identidad || 'No especificado'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Teléfono:</span>
                  <div className="font-semibold text-slate-800">
                    {cliente?.telefono || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Dirección:</span>
                  <div className="text-slate-700">
                    {cliente?.direccion || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Correo Electrónico:</span>
                  <div className="text-slate-700 font-mono text-[11px]">
                    {cliente?.correo || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Project / Service Subject Strip */}
            <div className="bg-sky-50/70 border-l-4 border-[#0066B3] px-3.5 py-2 rounded-r-xl border border-sky-100 flex items-center justify-between gap-2 avoid-break">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-[#0066B3] shrink-0 tracking-wider">
                  CONCEPTO:
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {factura.titulo_servicio || 'Servicios Electromecánicos e Industriales'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">
                Moneda: DOP (RD$)
              </span>
            </div>

            {/* 4. Detail Lines Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 avoid-break">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#004880] text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-3 text-center w-14">CANT.</th>
                    <th className="py-2 px-3.5">DESCRIPCIÓN DEL SERVICIO / MATERIAL</th>
                    <th className="py-2 px-3.5 text-right w-36">PRECIO UNITARIO</th>
                    <th className="py-2 px-3.5 text-right w-36">IMPORTE TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {detalles.map((item, idx) => {
                    const qty = Number(item.cantidad) || 0;
                    const unitPrice = Number(item.precio_unitario) || 0;
                    const total = qty * unitPrice;

                    return (
                      <tr
                        key={item.id || idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      >
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                          {qty}
                        </td>
                        <td className="py-2 px-3.5 text-slate-800 font-medium leading-relaxed">
                          {item.descripcion}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono text-slate-700">
                          {formatDOP(unitPrice)}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono font-bold text-slate-900">
                          {formatDOP(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. Bottom Section: Financial Totals */}
            <div className="flex justify-end avoid-break">
              {/* Financial Totals Card */}
              <div className="w-full sm:w-80 space-y-1 font-mono text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-600 font-sans text-[11px]">Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatDOP(factura.subtotal)}</span>
                </div>

                <div className="flex justify-between py-0.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-600 font-sans text-[11px]">
                    ITBIS (18%):
                  </span>
                  <span className="font-bold text-slate-900">
                    {factura.aplica_itbis
                      ? formatDOP(factura.impuestos || Number(factura.subtotal) * 0.18)
                      : 'Exento'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 px-2 bg-sky-50 rounded-lg border border-sky-200 text-sm font-black text-slate-900">
                  <span className="font-sans text-[#004E8A]">TOTAL DOP:</span>
                  <span className="text-[#004E8A] text-base">{formatDOP(factura.total)}</span>
                </div>

                {!isCotizacion && (
                  <div className="flex justify-between pt-1 text-[11px] font-bold text-amber-900 border-t border-slate-200">
                    <span className="font-sans">Saldo Pendiente:</span>
                    <span>{formatDOP(factura.saldo_pendiente)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 7. Official Compact Footer */}
          <div className="mt-4 pt-2.5 border-t border-slate-300 text-center text-[9px] text-slate-500 leading-normal font-sans avoid-break">
            <p className="font-medium text-slate-700">
              {empresa?.nombre_empresa || 'Manuel De Jesús Electroservicios SRL'} • RNC: {empresa?.rnc || '131-042961'} • {empresa?.direccion || 'Calle Manzana #39, 7A, Las Caobas, SDO'}
            </p>
            <p className="text-slate-500">
              Teléfonos: {empresa?.telefonos?.join(' / ') || '809-560-3948 / 829-383-0017'} • Correo: {empresa?.correo || 'servicioalcliente@madeles.org'} • Comprobante comercial oficial
            </p>
          </div>
        </div>
      </div>

      {/* Convertir Modal */}
      {isConvertModalOpen && (
        <ConvertirModal
          factura={factura}
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onSuccess={handleConversionSuccess}
        />
      )}

      {/* Cobro Modal */}
      {isCobroModalOpen && (
        <CobroModal
          factura={factura}
          isOpen={isCobroModalOpen}
          onClose={() => setIsCobroModalOpen(false)}
          onSuccess={handleCobroSuccess}
        />
      )}
    </div>
  );
}

export default function ImprimirDocumentoPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24">
          <MadeleLoader size="lg" text="Preparando documento oficial..." />
        </div>
      }
    >
      <ImprimirContent />
    </React.Suspense>
  );
}
