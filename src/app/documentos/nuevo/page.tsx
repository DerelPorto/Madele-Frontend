'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Select, Input, InputNumber, Switch, Segmented } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  AppstoreAddOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  BookOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import {
  useSiguienteSecuencia,
  useProximoComprobante,
  useFacturas,
} from '@/services/clientMainService';
import { ClienteModal } from '@/components/clientes/ClienteModal';
import { CatalogoServiciosModal } from '@/components/documentos/CatalogoServiciosModal';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage, formatDOP } from '@/lib/utils';
import type { Cliente, CreateFacturaInput } from '@/lib/types';
import { COMPROBANTES_SELECT_OPTIONS, validarNumeroComprobante } from '@/constants/comprobantes';
import { showErrorAlert } from '@/lib/swal';
import {
  Building,
  User,
  Zap,
  Calendar,
  Receipt,
  ShieldCheck,
  MapPin,
  Boxes,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

const detalleSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  cantidad: z.coerce.number().min(0.01, 'Cantidad mayor a 0'),
  precio_unitario: z.coerce.number().min(0, 'Precio unitario mayor o igual a 0'),
});

const constructorSchema = z.object({
  modo: z.enum(['COTIZACION', 'FACTURA_DIRECTA']),
  cliente_id: z.string().min(1, 'Debe seleccionar un cliente'),
  numero_cotizacion: z.string().optional(),
  numero_factura: z.string().optional(),
  tipo_comprobante: z.string().optional(),
  numero_comprobante: z.string().optional(),
  fecha_emision: z.string().min(10, 'Fecha de emisión requerida'),
  fecha_vencimiento: z.string().optional(),
  titulo_servicio: z.string().min(3, 'El título del servicio o proyecto es obligatorio'),
  aplica_itbis: z.boolean().default(true),
  notas: z.string().optional(),
  detalles: z.array(detalleSchema).min(1, 'Debe incluir al menos una línea de trabajo'),
});

type ConstructorFormValues = z.infer<typeof constructorSchema>;

function ConstructorContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isQuickClienteOpen, setIsQuickClienteOpen] = useState(false);
  const [isCatalogoModalOpen, setIsCatalogoModalOpen] = useState(false);

  // Fetch Clientes for Selector
  const { data: clientesData, refetch: refetchClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.getClientes({ limit: 100, activo: true }),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ConstructorFormValues>({
    resolver: zodResolver(constructorSchema) as any,
    defaultValues: {
      modo: 'COTIZACION',
      cliente_id: undefined,
      numero_cotizacion: '',
      numero_factura: '',
      tipo_comprobante: 'E31',
      numero_comprobante: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      titulo_servicio: '',
      aplica_itbis: true,
      notas: '',
      detalles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'detalles',
  });

  const watchModo = watch('modo');
  const watchClienteId = watch('cliente_id');
  const watchAplicaItbis = watch('aplica_itbis');
  const watchDetalles = watch('detalles');

  // Query Next Sequence from Backend
  const { data: secuenciaData, refetch: refetchSecuencia } = useSiguienteSecuencia(
    watchModo === 'COTIZACION' ? 'COTIZACION' : 'FACTURA',
  );

  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo');

  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null);
  const [ncfModificado, setNcfModificado] = useState('');
  const [codigoModificacion, setCodigoModificacion] = useState('1');
  const [fechaNcfModificado, setFechaNcfModificado] = useState('');

  // Facturas emitidas/cobradas para relacionar en Nota de Crédito
  const { data: facturasData } = useFacturas({ limit: 100 });
  const facturasParaModificar = useMemo(() => {
    return (facturasData?.data || []).filter(
      (f) => f.estado === 'EMITIDA' || f.estado === 'PAGADA',
    );
  }, [facturasData]);

  const tipoComprobanteWatch = watch('tipo_comprobante') || 'E31';
  const { data: proximoNcf } = useProximoComprobante(tipoComprobanteWatch);

  const isE34 =
    watchModo === 'FACTURA_DIRECTA' && tipoComprobanteWatch === 'E34';

  useEffect(() => {
    if (tipoParam === 'E34') {
      setValue('modo', 'FACTURA_DIRECTA');
      setValue('tipo_comprobante', 'E34');
    }
  }, [tipoParam, setValue]);

  const handleSelectFacturaParaModificar = (facturaId: string) => {
    const factura = facturasParaModificar.find((f) => f.id === facturaId);
    if (!factura) {
      setSelectedFacturaId(null);
      return;
    }
    setSelectedFacturaId(facturaId);
    if (factura.cliente_id) {
      setValue('cliente_id', String(factura.cliente_id));
    }
    const ncf = factura.numero_comprobante || factura.numero_factura || '';
    setNcfModificado(ncf);
    const fecha = factura.fecha_emision ? String(factura.fecha_emision).split('T')[0] : '';
    setFechaNcfModificado(fecha);

    setValue(
      'titulo_servicio',
      `Nota de Crédito por anulación/corrección de ${factura.numero_factura || ncf}`,
    );
    setValue('aplica_itbis', factura.aplica_itbis ?? true);

    if (factura.factura_detalles && factura.factura_detalles.length > 0) {
      setValue(
        'detalles',
        factura.factura_detalles.map((d: any) => ({
          descripcion: d.descripcion || 'Servicio o partida acreditada',
          cantidad: Number(d.cantidad) || 1,
          precio_unitario: Number(d.precio_unitario) || 0,
        })),
      );
    }
  };

  // Selected client details badge
  const selectedCliente = clientesData?.data?.find((c) => c.id === watchClienteId);

  // Sync client's default voucher type
  useEffect(() => {
    if (selectedCliente?.tipo_comprobante_defecto) {
      setValue('tipo_comprobante', selectedCliente.tipo_comprobante_defecto);
    }
  }, [selectedCliente?.tipo_comprobante_defecto, setValue]);

  // Auto-populate sequence if empty
  useEffect(() => {
    if (secuenciaData?.siguiente) {
      if (watchModo === 'COTIZACION') {
        const cur = getValues('numero_cotizacion');
        if (!cur) {
          setValue('numero_cotizacion', secuenciaData.siguiente);
        }
      } else {
        const cur = getValues('numero_factura');
        if (!cur) {
          setValue('numero_factura', secuenciaData.siguiente);
        }
      }
    }
  }, [secuenciaData?.siguiente, watchModo, setValue, getValues]);

  // Auto-cálculo de fecha de vencimiento (+30 días) al cambiar la fecha de emisión en cotizaciones
  const watchFechaEmision = watch('fecha_emision');
  useEffect(() => {
    if (watchFechaEmision && watchModo === 'COTIZACION') {
      const parts = watchFechaEmision.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + 30);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setValue('fecha_vencimiento', `${y}-${m}-${day}`);
      }
    }
  }, [watchFechaEmision, watchModo, setValue]);

  // Initialize dates and 1 empty row on mount (no dummy data)
  const initializedRef = React.useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    setValue('fecha_emision', today);
    setValue('fecha_vencimiento', dueDate);

    append({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
    });
  }, [setValue, append]);

  // Live Subtotal Calculation (ITBIS obligatorio 18%)
  const subtotal = (watchDetalles || []).reduce((acc, row) => {
    const qty = Number(row?.cantidad) || 0;
    const price = Number(row?.precio_unitario) || 0;
    return acc + qty * price;
  }, 0);

  const itbisMonto = Math.round(subtotal * 0.18 * 100) / 100;
  const totalCalculado = subtotal + itbisMonto;

  // Assistant Quick Add: 5% Imprevistos
  const handleAgregarImprevistos = () => {
    const cincoPorCiento = Math.round(subtotal * 0.05 * 100) / 100;
    append({
      descripcion: 'Imprevistos y calibración final (5%)',
      cantidad: 1,
      precio_unitario: cincoPorCiento,
    });
    toast.info(`Se agregó la fila de Imprevistos por ${formatDOP(cincoPorCiento)}`);
  };

  // Assistant Quick Add: Materiales Gastables
  const handleAgregarGastables = () => {
    append({
      descripcion: 'Materiales gastables',
      cantidad: 1,
      precio_unitario: 0,
    });
    toast.info('Se agregó la fila de Materiales gastables.');
  };

  // Assistant Quick Add: Mano de Obra
  const handleAgregarManoObra = () => {
    append({
      descripcion: 'Mano de obra técnica',
      cantidad: 1,
      precio_unitario: 0,
    });
    toast.info('Se agregó la fila de Mano de obra.');
  };

  const onSubmit = async (data: ConstructorFormValues) => {
    try {
      if (data.modo === 'FACTURA_DIRECTA' && data.numero_comprobante?.trim()) {
        const validacion = validarNumeroComprobante(data.numero_comprobante);
        if (!validacion.valido) {
          await showErrorAlert(validacion.error, 'Comprobante DGII Inválido');
          return;
        }
      }

      let notasFinales = data.notas?.trim() || undefined;
      if (isE34) {
        const metaE34 = `[NCF_MODIFICADO: ${ncfModificado || 'E310000000001'}] [CODIGO_MODIFICACION: ${codigoModificacion}] [FECHA_MODIFICADO: ${fechaNcfModificado || data.fecha_emision}]`;
        notasFinales = notasFinales ? `${metaE34}\n${notasFinales}` : metaE34;
      }

      const payload: CreateFacturaInput = {
        estado: data.modo === 'COTIZACION' ? 'COTIZACION' : 'EMITIDA',
        cliente_id: data.cliente_id,
        titulo_servicio: data.titulo_servicio.trim(),
        aplica_itbis: data.aplica_itbis,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento:
          data.modo === 'COTIZACION'
            ? data.fecha_vencimiento || data.fecha_emision
            : data.fecha_emision,
        notas: notasFinales,
        numero_cotizacion:
          data.modo === 'COTIZACION' ? data.numero_cotizacion?.trim() : undefined,
        numero_factura:
          data.modo === 'FACTURA_DIRECTA' ? data.numero_factura?.trim() : undefined,
        tipo_comprobante:
          data.modo === 'FACTURA_DIRECTA' ? data.tipo_comprobante : undefined,
        numero_comprobante: undefined,
        detalles: data.detalles.map((d, index) => ({
          orden: index + 1,
          descripcion: d.descripcion.trim(),
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
          impuesto_linea: data.aplica_itbis
            ? Number(d.cantidad) * Number(d.precio_unitario) * 0.18
            : 0,
        })),
      };

      const created = await api.createFactura(payload);

      // Celebration effect
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#0066B3', '#F59E0B', '#10B981'],
        });
      } catch {}

      toast.success(
        isE34
          ? `Nota de Crédito Electrónica #${created.numero_factura || created.numero_comprobante || created.id} emitida con éxito.`
          : data.modo === 'COTIZACION'
          ? `Cotización #${created.numero_cotizacion || created.id} guardada con éxito.`
          : `Factura Fiscal #${created.numero_factura || created.id} emitida con éxito.`,
      );

      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });

      router.push(`/documentos/${created.id}/imprimir`);
    } catch (err: any) {
      await showErrorAlert(err, 'Error al procesar el documento');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 pb-32"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <Link href="/documentos">
            <Button icon={<ArrowLeftOutlined />} shape="circle" size="large" />
          </Link>
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 ${
              isE34
                ? 'bg-amber-500/15 text-amber-800'
                : 'bg-[#0066B3]/10 text-[#0066B3]'
            }`}>
              {isE34 ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Rectificación / Anulación Fiscal e-CF</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 fill-[#0066B3]" />
                  <span>Hoja de Trabajo en Vivo</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isE34
                ? 'Emisión de Nota de Crédito (E34)'
                : 'Constructor de Cotizaciones & Facturas'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isE34
                ? 'Anule, rectifique o acredite operaciones fiscales emitidas vinculando el comprobante original según la Ley 32-23'
                : 'Crea partidas personalizadas con cálculo en tiempo real y asistente de imprevistos'}
            </p>
          </div>
        </div>

        {/* Dynamic Mode Switcher with Ant Design Segmented */}
        <div className="self-start sm:self-auto">
          <Segmented
            value={
              isE34
                ? 'NOTA_CREDITO_E34'
                : watchModo === 'COTIZACION'
                ? 'COTIZACION'
                : 'FACTURA_DIRECTA'
            }
            onChange={(val) => {
              if (val === 'COTIZACION') {
                setValue('modo', 'COTIZACION');
              } else if (val === 'FACTURA_DIRECTA') {
                setValue('modo', 'FACTURA_DIRECTA');
                if (tipoComprobanteWatch === 'E34') {
                  setValue('tipo_comprobante', 'E31');
                }
              } else if (val === 'NOTA_CREDITO_E34') {
                setValue('modo', 'FACTURA_DIRECTA');
                setValue('tipo_comprobante', 'E34');
              }
            }}
            options={[
              { label: 'Modo Cotización', value: 'COTIZACION' },
              { label: 'Factura Directa', value: 'FACTURA_DIRECTA' },
              { label: 'Nota de Crédito (E34)', value: 'NOTA_CREDITO_E34' },
            ]}
            className="font-bold p-1 bg-slate-200/80 shadow-inner"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Client Selection & Fiscal Metadata */}
        <div className="bg-white p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          {/* Bloque Superior: Cliente Receptor (Izq) y Parámetros del Documento (Der) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* LADO IZQUIERDO: CLIENTE RECEPTOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 h-8">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#0066B3]" />
                  Cliente Receptor <span className="text-red-500">*</span>
                </label>
                <Button
                  type="dashed"
                  size="small"
                  icon={<UserAddOutlined />}
                  onClick={() => setIsQuickClienteOpen(true)}
                  className="font-bold text-[#0066B3] border-sky-300 hover:border-[#0066B3] text-xs h-7"
                >
                  + Nuevo Cliente
                </Button>
              </div>

              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || undefined}
                    showSearch
                    allowClear
                    size="large"
                    placeholder="Seleccione o busque un cliente por nombre o RNC..."
                    className="w-full font-semibold"
                    status={errors.cliente_id ? 'error' : ''}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={clientesData?.data?.map((cli) => ({
                      value: cli.id,
                      label: `${cli.nombre_razon_social} (${cli.codigo_cliente})`,
                    }))}
                  />
                )}
              />
              {errors.cliente_id && (
                <p className="text-[11px] text-red-600 font-semibold">{errors.cliente_id.message}</p>
              )}

              {/* Dynamic Client Info Box */}
              {selectedCliente ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-slate-50/90 border border-slate-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {selectedCliente.nombre_razon_social}
                    </span>
                    <span className="px-2 py-0.5 bg-sky-100 text-[#0066B3] font-mono font-bold text-[10px]">
                      {selectedCliente.codigo_cliente}
                    </span>
                  </div>
                  {selectedCliente.persona_contacto && (
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedCliente.persona_contacto}</span>
                    </div>
                  )}
                  {selectedCliente.documento_identidad && (
                    <div className="text-[11px] text-slate-600 font-mono">
                      RNC / Cédula:{' '}
                      <strong className="text-slate-900 font-bold">
                        {selectedCliente.documento_identidad}
                      </strong>
                    </div>
                  )}
                  {selectedCliente.direccion && (
                    <div className="flex items-start gap-1.5 text-slate-500 text-[11px] pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{selectedCliente.direccion}</span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="p-3.5 border border-dashed border-slate-200 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1 py-4 bg-slate-50/50">
                  <User className="w-5 h-5 text-slate-300" />
                  <span>Ningún cliente seleccionado</span>
                  <span className="text-[10px] text-slate-400">
                    Los datos fiscales y comprobante se cargarán automáticamente
                  </span>
                </div>
              )}
            </div>

            {/* LADO DERECHO: DATOS GENERALES DEL DOCUMENTO */}
            <div className="space-y-3">
              <div className="pb-1 border-b border-slate-100 flex items-center justify-between h-8">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#0066B3]" />
                  {watchModo === 'COTIZACION'
                    ? 'Parámetros de Cotización'
                    : isE34
                    ? 'Datos de Nota de Crédito'
                    : 'Datos de Factura Fiscal'}
                </label>
                <span className="text-[11px] font-mono font-bold text-[#0066B3] bg-sky-50 px-2.5 py-0.5 border border-sky-200">
                  {watchModo === 'COTIZACION'
                    ? 'Documento Comercial'
                    : isE34
                    ? 'e-CF Tipo 34'
                    : 'Documento Fiscal'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* N.º Documento */}
                <div>
                  <div className="h-5 flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 truncate">
                      {watchModo === 'COTIZACION'
                        ? 'N.º Cotización'
                        : isE34
                        ? 'N.º Nota Crédito'
                        : 'N.º Factura'}
                    </label>
                    <span className="text-[10px] text-[#0066B3] font-mono font-semibold">
                      (Automático)
                    </span>
                  </div>
                  <Input
                    size="large"
                    value={
                      watchModo === 'COTIZACION'
                        ? watch('numero_cotizacion') || secuenciaData?.siguiente || ''
                        : watch('numero_factura') || secuenciaData?.siguiente || ''
                    }
                    readOnly
                    placeholder="Automático"
                    className="font-mono font-bold bg-slate-50 text-slate-900 border-slate-200"
                  />
                </div>

                {/* Fecha de Emisión */}
                <div>
                  <div className="h-5 flex items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Fecha de Emisión
                    </label>
                  </div>
                  <Controller
                    name="fecha_emision"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        size="large"
                        {...field}
                        className="font-mono font-medium"
                      />
                    )}
                  />
                </div>

                {/* Fecha de Vencimiento: Solo aplica en Cotizaciones comerciales */}
                {watchModo === 'COTIZACION' && (
                  <div className="sm:col-span-2">
                    <div className="h-5 flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0066B3]" />
                        Validez de Cotización / Vencimiento
                      </label>
                      <span className="text-[10px] text-[#0066B3] font-bold">
                        (Cálculo automático: +30 días)
                      </span>
                    </div>
                    <Controller
                      name="fecha_vencimiento"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          size="large"
                          {...field}
                          className="font-mono font-medium"
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloque Inferior: Fiscalidad DGII a Ancho Completo */}
          {watchModo === 'FACTURA_DIRECTA' && (
            <div className="pt-4 border-t border-slate-200/80">
              {isE34 ? (
                /* Panel Especializado de Nota de Crédito (E34) a Ancho Completo */
                <div className="p-5 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border-2 border-amber-300 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/80">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs tracking-wider">
                        E34
                      </span>
                      <div>
                        <span className="font-black text-sm text-amber-950 uppercase tracking-tight block">
                          Vinculación con Documento Original DGII (Ley 32-23)
                        </span>
                        <span className="text-xs text-amber-900/80">
                          Seleccione la factura emitida/cobrada para anular o acreditar sus montos fiscalmente
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-900 bg-amber-200/90 px-3 py-1 self-start sm:self-auto border border-amber-300">
                      Reemplazo Fiscal de Anulación
                    </span>
                  </div>

                  {/* Fila A: Factura a anular (amplia) y e-NCF Modificado */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <div className="h-5 flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Factura Original a Modificar / Anular
                        </label>
                        <span className="text-[11px] text-sky-700 font-semibold font-mono">
                          (Emitidas / Cobradas)
                        </span>
                      </div>
                      <Select
                        size="large"
                        className="w-full font-semibold"
                        showSearch
                        allowClear
                        placeholder="Seleccione la factura a anular o acreditar..."
                        value={selectedFacturaId}
                        onChange={handleSelectFacturaParaModificar}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={facturasParaModificar?.map((f) => ({
                          value: f.id,
                          label: `${f.numero_comprobante || f.numero_factura || f.id} — ${f.clientes?.nombre_razon_social || 'Cliente'} — ${formatDOP(f.total)}`,
                        }))}
                      />
                    </div>

                    <div className="md:col-span-4">
                      <div className="h-5 flex items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          e-NCF o NCF Modificado <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <Input
                        size="large"
                        value={ncfModificado}
                        onChange={(e) => setNcfModificado(e.target.value.toUpperCase().trim())}
                        placeholder="Ej: E310000000005"
                        className="font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Fila B: Motivo DGII y NCF Asignado E34 */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <div className="h-5 flex items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Motivo / Código de Modificación DGII <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <Select
                        size="large"
                        className="w-full font-bold"
                        value={codigoModificacion}
                        onChange={(val) => setCodigoModificacion(val)}
                        options={[
                          { value: '1', label: '1 - Anulación Total del Comprobante' },
                          { value: '2', label: '2 - Corrección de Texto o Datos' },
                          { value: '3', label: '3 - Corrección de Importes / Montos' },
                          { value: '4', label: '4 - Devolución de Bienes / Servicios' },
                          { value: '5', label: '5 - Descuento o Bonificación' },
                        ]}
                      />
                    </div>

                    <div className="md:col-span-4">
                      <div className="h-5 flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          NCF E34 Asignado
                        </label>
                      </div>
                      <div className="h-[40px] flex items-center gap-2 px-3 bg-white border border-amber-300 font-mono text-xs font-bold text-slate-900 shadow-xs">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="truncate">Asignación automática al guardar</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fiscalidad Estándar Factura Directa (Ancho Completo, 2 Columnas Amplias y Equilibradas) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <div className="h-5 flex items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        Tipo Comprobante DGII
                      </label>
                    </div>
                    <Controller
                      name="tipo_comprobante"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          size="large"
                          className="w-full font-bold"
                          showSearch
                          placeholder="Seleccione tipo e-CF"
                          filterOption={(input, option) => {
                            if (!input) return true;
                            const opt = option as any;
                            const label = String(opt?.label ?? '').toLowerCase();
                            const value = String(opt?.value ?? '').toLowerCase();
                            const search = input.toLowerCase();
                            return label.includes(search) || value.includes(search);
                          }}
                          options={COMPROBANTES_SELECT_OPTIONS}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <div className="h-5 flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        NCF Asignado (Lote Activo)
                      </label>
                    </div>
                    <div className="h-[40px] flex items-center gap-2 px-3 bg-sky-50 border border-sky-300 font-mono text-xs font-bold text-[#0066B3]">
                      <Lock className="w-3.5 h-3.5 text-[#0066B3]" />
                      <span className="truncate">Asignación automática al emitir (Protección concurrente)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 2: Concepto General del Trabajo (Rediseño Limpio y Armónico) */}
        <div className="bg-white p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-2.5 border-l-4 border-l-[#0066B3]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#0066B3]" />
              Título / Concepto General del Servicio o Proyecto <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              Aparecerá destacado en la casilla SERVICIO del documento impreso
            </span>
          </div>

          <Controller
            name="titulo_servicio"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                size="large"
                placeholder="Ej: Reestructuración y mantenimiento de transfer automático y banco de condensadores..."
                className="font-semibold text-sm py-2.5 border-slate-300 focus:border-[#0066B3]"
              />
            )}
          />
          {errors.titulo_servicio && (
            <p className="text-[11px] text-red-600 font-bold">{errors.titulo_servicio.message}</p>
          )}
        </div>

        {/* Card 3: Dynamic Table of Open Lines with Ant Design Buttons */}
        <div className="bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Action Assistant Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#0066B3]" />
                Líneas Abiertas de Partidas ({fields.length})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ingresa libremente materiales, equipos, mano de obra e imprevistos
              </p>
            </div>

            {/* Ant Design Assistant Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="dashed"
                icon={<BookOutlined className="text-[#0066B3]" />}
                onClick={() => setIsCatalogoModalOpen(true)}
                className="border-sky-300 bg-sky-50 text-[#0066B3] font-bold"
              >
                Catálogo de Servicios
              </Button>

              <Button
                type="dashed"
                icon={<ThunderboltOutlined className="text-amber-500" />}
                onClick={handleAgregarImprevistos}
                className="border-amber-200 bg-amber-50/60 text-slate-800 font-bold"
              >
                + Imprevistos (5%)
              </Button>

              <Button
                icon={<ToolOutlined />}
                onClick={handleAgregarManoObra}
                className="font-bold"
              >
                + Mano de Obra
              </Button>

              <Button
                icon={<AppstoreAddOutlined />}
                onClick={handleAgregarGastables}
                className="font-bold"
              >
                + Materiales
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  append({
                    descripcion: '',
                    cantidad: 1,
                    precio_unitario: 0,
                  })
                }
                className="bg-[#0066B3] hover:bg-[#004E8A] font-bold rounded-xl shadow-sm"
              >
                Agregar Línea
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-black uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-3 w-12 text-center">#</th>
                  <th className="py-3.5 px-3 w-32 text-center">Cantidad</th>
                  <th className="py-3.5 px-4">Descripción de la Partida / Equipo</th>
                  <th className="py-3.5 px-4 w-56 min-w-[210px] text-right">Precio / U</th>
                  <th className="py-3.5 px-4 w-52 min-w-[190px] text-right">Importe</th>
                  <th className="py-3.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence initial={false}>
                  {fields.map((field, index) => {
                    const qty = Number(watchDetalles?.[index]?.cantidad) || 0;
                    const price = Number(watchDetalles?.[index]?.precio_unitario) || 0;
                    const lineTotal = qty * price;

                    return (
                      <motion.tr
                        key={field.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-sky-50/30 transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>

                        <td className="py-2.5 px-3">
                          <Controller
                            name={`detalles.${index}.cantidad` as const}
                            control={control}
                            render={({ field }) => (
                              <InputNumber
                                {...field}
                                min={1}
                                step={1}
                                precision={0}
                                stringMode={false}
                                parser={(val) => (val ? val.replace(/\D/g, '') : '')}
                                onKeyDown={(e) => {
                                  if (
                                    !/[\d]/.test(e.key) &&
                                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                                    !e.ctrlKey &&
                                    !e.metaKey
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                                size="large"
                                className="w-full font-mono font-bold text-center"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4">
                          <Controller
                            name={`detalles.${index}.descripcion` as const}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                size="large"
                                placeholder="Descripción del material, equipo o trabajo..."
                                className="font-semibold text-xs"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4 w-56 min-w-[210px] text-right">
                          <Controller
                            name={`detalles.${index}.precio_unitario` as const}
                            control={control}
                            render={({ field }) => (
                              <InputNumber
                                {...field}
                                min={0}
                                step={100}
                                size="large"
                                prefix="RD$"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => (value?.replace(/RD\$\s?|\$\s?|(,*)/g, '') as unknown as number)}
                                className="w-full font-mono font-bold text-right"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4 w-52 min-w-[190px] text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                          {formatDOP(lineTotal)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {fields.length > 1 && (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(index)}
                              size="middle"
                              className="hover:bg-red-50"
                            />
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Notes (Left) & Financial Totals (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7">
          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Notas y Términos Comerciales</span>
              <span className="text-[10px] text-slate-400 font-normal">(Visible al pie del documento impreso)</span>
            </label>
            <Controller
              name="notas"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={5}
                  placeholder="Ej: Validez de la oferta 15 días. 50% de anticipo y 50% contra entrega. Incluye garantía de 6 meses..."
                  className="font-medium text-xs p-3.5 border-slate-300 focus:border-[#0066B3]"
                />
              )}
            />
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-3 bg-gradient-to-br from-slate-50 to-white p-5 border border-slate-200 flex flex-col justify-between">
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-600 pb-2 border-b border-slate-200">
                <span className="font-semibold font-sans">Subtotal partidas:</span>
                <span className="font-bold text-sm text-slate-900">{formatDOP(subtotal)}</span>
              </div>

              {/* ITBIS Obligatorio (18%) */}
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 font-sans flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-sky-100 text-[#0066B3] text-[10px] font-black uppercase">
                    Obligatorio
                  </span>
                  ITBIS (18%):
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatDOP(itbisMonto)}
                </span>
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center pt-2 text-base font-bold">
                <span className="text-slate-900 font-sans font-black">Total:</span>
                <span className="text-[#0066B3] text-2xl font-black tracking-tight">
                  {formatDOP(totalCalculado)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link href="/documentos">
                <Button size="large">Cancelar</Button>
              </Link>

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isSubmitting}
                icon={<SaveOutlined />}
                className={
                  isE34
                    ? 'bg-amber-600 hover:bg-amber-700 font-bold'
                    : 'bg-[#0066B3] hover:bg-[#004E8A] font-bold'
                }
              >
                {isE34
                  ? 'Emitir Nota de Crédito (E34)'
                  : watchModo === 'COTIZACION'
                  ? 'Guardar Cotización'
                  : 'Emitir Factura Fiscal'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Floating Sticky Calculation Dock at bottom with Ant Design Button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] glass-panel px-5 py-3 shadow-2xl border border-sky-300/40 flex items-center justify-between text-xs no-print backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0066B3] text-white flex items-center justify-center font-bold shadow-md shadow-[#0066B3]/30">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">
              {isE34
                ? 'Total Nota de Crédito'
                : watchModo === 'COTIZACION'
                ? 'Total Cotización'
                : 'Total Factura'}
            </div>
            <div className="font-mono font-black text-base text-slate-900">
              {formatDOP(totalCalculado)}
            </div>
          </div>
        </div>

        <Button
          type="primary"
          size="large"
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting}
          icon={<CheckCircleOutlined />}
          className={
            isE34
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-none shadow-lg'
              : 'bg-[#0066B3] hover:bg-[#004E8A] text-white font-black border-none shadow-lg shadow-[#0066B3]/30'
          }
        >
          {isE34
            ? 'Emitir Nota de Crédito (E34)'
            : watchModo === 'COTIZACION'
            ? 'Guardar Cotización'
            : 'Confirmar y Guardar'}
        </Button>
      </div>

      {/* Quick Create Cliente Modal */}
      <ClienteModal
        isOpen={isQuickClienteOpen}
        onClose={() => setIsQuickClienteOpen(false)}
        onSuccess={(newCli) => {
          refetchClientes();
          setValue('cliente_id', newCli.id);
        }}
      />

      {/* Catalog of Frequent Services Modal */}
      <CatalogoServiciosModal
        isOpen={isCatalogoModalOpen}
        onClose={() => setIsCatalogoModalOpen(false)}
        onSelectServicio={(srv) => {
          append({
            descripcion: srv.nombre,
            cantidad: 1,
            precio_unitario: Number(srv.precio),
          });
          toast.success(`Servicio "${srv.nombre}" insertado con precio ${formatDOP(srv.precio)}`);
        }}
      />
    </motion.div>
  );
}

export default function NuevoDocumentoPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24">
          <MadeleLoader size="lg" text="Inicializando constructor de documentos..." />
        </div>
      }
    >
      <ConstructorContent />
    </React.Suspense>
  );
}
