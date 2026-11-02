'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
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
import { useSiguienteSecuencia } from '@/services/clientMainService';
import { ClienteModal } from '@/components/clientes/ClienteModal';
import { CatalogoServiciosModal } from '@/components/documentos/CatalogoServiciosModal';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage, formatDOP } from '@/lib/utils';
import type { Cliente, CreateFacturaInput } from '@/lib/types';
import {
  Building,
  User,
  Zap,
  Calendar,
  Receipt,
  ShieldCheck,
  MapPin,
  Boxes,
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
  fecha_vencimiento: z.string().min(10, 'Fecha de vencimiento requerida'),
  titulo_servicio: z.string().min(3, 'El título del servicio o proyecto es obligatorio'),
  aplica_itbis: z.boolean().default(false),
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
      cliente_id: '',
      numero_cotizacion: '',
      numero_factura: '',
      tipo_comprobante: 'B01',
      numero_comprobante: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      titulo_servicio: '',
      aplica_itbis: false,
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

  // Live Subtotal Calculation
  const subtotal = (watchDetalles || []).reduce((acc, row) => {
    const qty = Number(row?.cantidad) || 0;
    const price = Number(row?.precio_unitario) || 0;
    return acc + qty * price;
  }, 0);

  const itbisMonto = watchAplicaItbis ? subtotal * 0.18 : 0;
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
      const payload: CreateFacturaInput = {
        estado: data.modo === 'COTIZACION' ? 'COTIZACION' : 'EMITIDA',
        cliente_id: data.cliente_id,
        titulo_servicio: data.titulo_servicio.trim(),
        aplica_itbis: data.aplica_itbis,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento: data.fecha_vencimiento,
        notas: data.notas?.trim() || undefined,
        numero_cotizacion:
          data.modo === 'COTIZACION' ? data.numero_cotizacion?.trim() : undefined,
        numero_factura:
          data.modo === 'FACTURA_DIRECTA' ? data.numero_factura?.trim() : undefined,
        tipo_comprobante:
          data.modo === 'FACTURA_DIRECTA' ? data.tipo_comprobante : undefined,
        numero_comprobante:
          data.modo === 'FACTURA_DIRECTA'
            ? data.numero_comprobante?.trim() || undefined
            : undefined,
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
        data.modo === 'COTIZACION'
          ? `Cotización #${created.numero_cotizacion || created.id} guardada con éxito.`
          : `Factura Fiscal #${created.numero_factura || created.id} emitida con éxito.`,
      );

      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });

      router.push(`/documentos/${created.id}/imprimir`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), 'Error al guardar documento');
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0066B3]/10 text-[#0066B3] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Zap className="w-3 h-3 fill-[#0066B3]" />
              Hoja de Trabajo en Vivo
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Constructor de Cotizaciones & Facturas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Crea partidas personalizadas con cálculo en tiempo real y asistente de imprevistos
            </p>
          </div>
        </div>

        {/* Dynamic Mode Switcher with Ant Design Segmented */}
        <div className="self-start sm:self-auto">
          <Segmented
            value={watchModo}
            onChange={(val) => setValue('modo', val as any)}
            options={[
              { label: 'Modo Cotización', value: 'COTIZACION' },
              { label: 'Factura Directa', value: 'FACTURA_DIRECTA' },
            ]}
            className="font-bold p-1 bg-slate-200/80 shadow-inner"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Client Selection & Meta */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Selector with Ant Design Select */}
            <div className="space-y-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#0066B3]" />
                  Cliente Receptor *
                </label>
                <Button
                  type="link"
                  size="small"
                  icon={<UserAddOutlined />}
                  onClick={() => setIsQuickClienteOpen(true)}
                  className="font-bold text-[#0066B3] p-0 h-auto"
                >
                  + Rápido
                </Button>
              </div>

              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder="Buscar o seleccionar cliente..."
                    className="w-full font-bold"
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
              {selectedCliente && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-gradient-to-br from-sky-50 to-white rounded-2xl border border-sky-100 text-xs space-y-1.5 shadow-xs"
                >
                  {selectedCliente.persona_contacto && (
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{selectedCliente.persona_contacto}</span>
                    </div>
                  )}
                  {selectedCliente.direccion && (
                    <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{selectedCliente.direccion}</span>
                    </div>
                  )}
                  {selectedCliente.documento_identidad && (
                    <div className="text-[11px] text-slate-500 font-mono font-medium">
                      RNC / Cédula: <strong className="text-slate-800">{selectedCliente.documento_identidad}</strong>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Document Metadata & Dates with Ant Design Inputs */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {watchModo === 'COTIZACION' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-[#0066B3]" />
                      N.º Cotización
                    </label>
                    {secuenciaData?.siguiente && (
                      <button
                        type="button"
                        onClick={() => setValue('numero_cotizacion', secuenciaData.siguiente)}
                        className="text-[10px] text-[#0066B3] font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                      >
                        Auto: {secuenciaData.siguiente}
                      </button>
                    )}
                  </div>
                  <Controller
                    name="numero_cotizacion"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Número de cotización" className="font-mono font-bold" />
                    )}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-slate-700" />
                        N.º Factura Fiscal *
                      </label>
                      {secuenciaData?.siguiente && (
                        <button
                          type="button"
                          onClick={() => setValue('numero_factura', secuenciaData.siguiente)}
                          className="text-[10px] text-[#0066B3] font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                        >
                          Auto: {secuenciaData.siguiente}
                        </button>
                      )}
                    </div>
                    <Controller
                      name="numero_factura"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Número de factura fiscal" className="font-mono font-bold" />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tipo Comprobante
                    </label>
                    <Controller
                      name="tipo_comprobante"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full font-bold"
                          options={[
                            { value: 'B01', label: 'B01 - Crédito Fiscal' },
                            { value: 'B02', label: 'B02 - Consumo Final' },
                            { value: 'B14', label: 'B14 - Régimen Especial' },
                            { value: 'B15', label: 'B15 - Gubernamental' },
                          ]}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      NCF Oficial DGII
                    </label>
                    <Controller
                      name="numero_comprobante"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Número de comprobante NCF" className="font-mono font-bold uppercase" />
                      )}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Fecha de Emisión
                </label>
                <Controller
                  name="fecha_emision"
                  control={control}
                  render={({ field }) => (
                    <Input type="date" {...field} className="font-mono font-medium" />
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Fecha de Vencimiento
                </label>
                <Controller
                  name="fecha_vencimiento"
                  control={control}
                  render={({ field }) => (
                    <Input type="date" {...field} className="font-mono font-medium" />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Concepto General del Trabajo (Blue Banner #0066B3) */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0066B3] via-[#005494] to-[#004880] p-5 shadow-xl shadow-[#0066B3]/25 text-white space-y-2 border border-sky-400/30">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-amber-300" />
              Título / Concepto General del Servicio o Proyecto *
            </label>
            <span className="text-[10px] text-sky-200">Aparecerá en la barra SERVICIO del documento oficial</span>
          </div>

          <Controller
            name="titulo_servicio"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                size="large"
                placeholder="Título o concepto general del trabajo..."
                className="font-bold text-sm bg-white/10 text-white placeholder:text-sky-200/80 border-white/25 focus:bg-white focus:text-slate-900"
              />
            )}
          />
          {errors.titulo_servicio && (
            <p className="text-[11px] text-amber-300 font-bold">{errors.titulo_servicio.message}</p>
          )}
        </div>

        {/* Card 3: Dynamic Table of Open Lines with Ant Design Buttons */}
        <div className="glass-panel rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Action Assistant Bar */}
          <div className="p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
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
                className="border-sky-400 bg-sky-50 text-[#0066B3] font-bold"
              >
                Catálogo de Servicios
              </Button>

              <Button
                type="dashed"
                icon={<ThunderboltOutlined className="text-amber-600" />}
                onClick={handleAgregarImprevistos}
                className="border-amber-400 bg-amber-50 text-amber-950 font-bold"
              >
                + Imprevistos 5%
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
                className="bg-[#0066B3] font-bold"
              >
                Agregar Línea
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#0066B3]/8 text-[#0066B3] border-b border-slate-200 font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-28 text-center">Cantidad</th>
                  <th className="py-3 px-4">Descripción de la Partida / Equipo</th>
                  <th className="py-3 px-4 w-36 text-right">Precio / U (DOP)</th>
                  <th className="py-3 px-4 w-36 text-right">Total (DOP)</th>
                  <th className="py-3 px-3 w-12 text-center"></th>
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
                                min={0.01}
                                step={1}
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
                                placeholder="Descripción de la partida o material..."
                                className="font-semibold"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <Controller
                            name={`detalles.${index}.precio_unitario` as const}
                            control={control}
                            render={({ field }) => (
                              <InputNumber
                                {...field}
                                min={0}
                                step={100}
                                prefix="RD$"
                                className="w-full font-mono font-bold text-right"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                          {formatDOP(lineTotal)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {fields.length > 1 && (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(index)}
                              size="small"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 glass-panel rounded-3xl border border-slate-200/90 shadow-sm p-6">
          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Notas y Términos Comerciales</span>
              <span className="text-[10px] text-slate-400 font-normal">(Visible en pie de impresión)</span>
            </label>
            <Controller
              name="notas"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={5}
                  placeholder="Escriba condiciones de pago, tiempo de entrega o garantías..."
                  className="font-medium text-xs p-3"
                />
              )}
            />
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-3 bg-gradient-to-br from-slate-50 to-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-600 pb-2 border-b border-slate-200">
                <span className="font-semibold font-sans">Subtotal partidas:</span>
                <span className="font-bold text-sm text-slate-900">{formatDOP(subtotal)}</span>
              </div>

              {/* Ant Design Switch ITBIS */}
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Controller
                    name="aplica_itbis"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  <span className="text-xs font-bold text-slate-800 font-sans">
                    Aplicar ITBIS (18%)
                  </span>
                </div>
                <span className={`font-bold ${watchAplicaItbis ? 'text-slate-900' : 'text-slate-400'}`}>
                  {watchAplicaItbis ? formatDOP(itbisMonto) : 'Exento (RD$ 0.00)'}
                </span>
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center pt-2 text-base font-bold">
                <span className="text-slate-900 font-sans font-black">Total DOP:</span>
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
                className="bg-[#0066B3] hover:bg-[#004E8A] font-bold"
              >
                {watchModo === 'COTIZACION' ? 'Guardar Cotización' : 'Emitir Factura Fiscal'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Floating Sticky Calculation Dock at bottom with Ant Design Button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] glass-panel px-5 py-3 rounded-2xl shadow-2xl border border-sky-300/40 flex items-center justify-between text-xs no-print backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0066B3] text-white flex items-center justify-center font-bold">
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">
              {watchModo === 'COTIZACION' ? 'Total Cotización' : 'Total Factura'}
            </div>
            <div className="font-mono font-black text-base text-[#0066B3]">
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
          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black border-none"
        >
          Confirmar y Guardar
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
