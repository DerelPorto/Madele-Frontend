'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Select, Input, InputNumber, Switch } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  AppstoreAddOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import { useFactura, useUpdateFactura, useClientes } from '@/services/clientMainService';
import { CatalogoServiciosModal } from '@/components/documentos/CatalogoServiciosModal';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { useToast } from '@/providers/ToastProvider';
import { extractErrorMessage, formatDOP } from '@/lib/utils';
import { showErrorAlert } from '@/lib/swal';
import {
  Building,
  User,
  Zap,
  Calendar,
  Receipt,
  MapPin,
  Boxes,
  ArrowLeft,
  ShieldAlert,
  Printer,
} from 'lucide-react';
import Link from 'next/link';

const detalleSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  cantidad: z.coerce.number().min(0.01, 'Cantidad mayor a 0'),
  precio_unitario: z.coerce.number().min(0, 'Precio unitario mayor o igual a 0'),
});

const editSchema = z.object({
  cliente_id: z.string().min(1, 'Debe seleccionar un cliente'),
  numero_cotizacion: z.string().optional(),
  fecha_emision: z.string().min(10, 'Fecha de emisión requerida'),
  fecha_vencimiento: z.string().min(10, 'Fecha de vencimiento requerida'),
  titulo_servicio: z.string().min(3, 'El título del servicio o proyecto es obligatorio'),
  aplica_itbis: z.boolean().default(true),
  notas: z.string().optional(),
  detalles: z.array(detalleSchema).min(1, 'Debe incluir al menos una línea'),
});

type EditFormValues = z.infer<typeof editSchema>;

function EditarContent() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params?.id as string;

  const [isCatalogoModalOpen, setIsCatalogoModalOpen] = useState(false);

  const { data: factura, isLoading: loadingFactura } = useFactura(id);
  const { data: clientesData } = useClientes({ limit: 100, activo: true });
  const updateFacturaMutation = useUpdateFactura();

  const canEdit =
    factura &&
    factura.estado !== 'ANULADA' &&
    factura.estado !== 'PAGADA' &&
    factura.estado !== 'PAGADA_PARCIAL' &&
    (!factura.cobro_facturas || factura.cobro_facturas.length === 0);

  const isCotizacion =
    factura?.estado === 'COTIZACION' || factura?.estado === 'BORRADOR';

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      cliente_id: '',
      numero_cotizacion: '',
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

  const watchClienteId = watch('cliente_id');
  const watchAplicaItbis = watch('aplica_itbis');
  const watchDetalles = watch('detalles');
  const watchFechaEmision = watch('fecha_emision');

  // Auto-cálculo de vencimiento (+30 días) en cotización al cambiar fecha de emisión
  useEffect(() => {
    if (watchFechaEmision && isCotizacion) {
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
  }, [watchFechaEmision, isCotizacion, setValue]);

  // Populate data when factura is loaded (cotizaciones y facturas antes de ser cobradas)
  useEffect(() => {
    if (factura && canEdit) {
      reset({
        cliente_id: factura.cliente_id,
        numero_cotizacion: factura.numero_cotizacion || factura.numero_factura || '',
        fecha_emision: factura.fecha_emision?.split('T')[0] || '',
        fecha_vencimiento: factura.fecha_vencimiento?.split('T')[0] || '',
        titulo_servicio: factura.titulo_servicio || '',
        aplica_itbis: true,
        notas: factura.notas || '',
        detalles: (factura.factura_detalles || []).map((d) => ({
          descripcion: d.descripcion,
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
        })),
      });
    }
  }, [factura?.id, factura?.estado, canEdit, reset]);

  const selectedCliente = clientesData?.data?.find((c) => c.id === watchClienteId);

  // Live Subtotal Calculation (ITBIS obligatorio 18%)
  const subtotal = (watchDetalles || []).reduce((acc, row) => {
    const qty = Number(row?.cantidad) || 0;
    const price = Number(row?.precio_unitario) || 0;
    return acc + qty * price;
  }, 0);

  const itbisMonto = Math.round(subtotal * 0.18 * 100) / 100;
  const totalCalculado = subtotal + itbisMonto;

  const handleAgregarImprevistos = () => {
    const cincoPorCiento = Math.round(subtotal * 0.05 * 100) / 100;
    append({
      descripcion: 'Imprevistos y calibración final (5%)',
      cantidad: 1,
      precio_unitario: cincoPorCiento,
    });
    toast.info(`Se agregó la fila de Imprevistos por ${formatDOP(cincoPorCiento)}`);
  };

  const handleAgregarGastables = () => {
    append({
      descripcion: 'Materiales gastables y cableado de control',
      cantidad: 1,
      precio_unitario: 0,
    });
    toast.info('Se agregó la fila de Materiales gastables.');
  };

  const handleAgregarManoObra = () => {
    append({
      descripcion: 'Mano de obra técnica especializada de instalación y prueba',
      cantidad: 1,
      precio_unitario: 0,
    });
    toast.info('Se agregó la fila de Mano de obra especializada.');
  };

  const onSubmit = async (data: EditFormValues) => {
    try {
      await updateFacturaMutation.mutateAsync({
        id,
        data: {
          cliente_id: data.cliente_id,
          numero_cotizacion: data.numero_cotizacion?.trim(),
          titulo_servicio: data.titulo_servicio.trim(),
          aplica_itbis: data.aplica_itbis,
          fecha_emision: data.fecha_emision,
          fecha_vencimiento: data.fecha_vencimiento,
          notas: data.notas?.trim() || undefined,
          detalles: data.detalles.map((d, index) => ({
            orden: index + 1,
            descripcion: d.descripcion.trim(),
            cantidad: Number(d.cantidad),
            precio_unitario: Number(d.precio_unitario),
            impuesto_linea: data.aplica_itbis
              ? Number(d.cantidad) * Number(d.precio_unitario) * 0.18
              : 0,
          })),
        },
      });

      toast.success('Cotización actualizada exitosamente.');
      router.push(`/documentos/${id}/imprimir`);
    } catch (err: any) {
      await showErrorAlert(err, 'Error al actualizar cotización');
    }
  };

  if (loadingFactura) {
    return (
      <div className="py-24">
        <MadeleLoader
          size="lg"
          text="Cargando documento para edición..."
          subtext="Recuperando partidas y detalles comerciales"
        />
      </div>
    );
  }

  if (factura && !canEdit) {
    return (
      <div className="p-6 sm:p-10 max-w-2xl mx-auto my-12 text-center space-y-5 bg-white rounded-3xl shadow-xl border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0066B3] flex items-center justify-center mx-auto border border-sky-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
            Control Comercial
          </span>
          <h2 className="text-xl font-black text-slate-900">
            Documento Cobrado / No Editable — Solo Lectura
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            El documento <strong>{factura.numero_factura || `FAC-${factura.id}`}</strong> cuenta con estado{' '}
            <strong className="text-slate-900">{factura.estado}</strong> y posee cobros registrados o se encuentra anulado. Solo se pueden editar cotizaciones y facturas antes de ser cobradas.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            href={`/documentos/${factura.id}/imprimir`}
            className="px-4 py-2.5 bg-[#0066B3] hover:bg-[#004E8A] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            Ver e Imprimir Comprobante Oficial
          </Link>
          <Link
            href="/documentos"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Bandeja
          </Link>
        </div>
      </div>
    );
  }

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
              Modo Edición
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Editar Cotización #{factura?.numero_cotizacion || id}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modifica partidas, fechas o receptor de la propuesta comercial
            </p>
          </div>
        </div>

        <Link href={`/documentos/${id}/imprimir`}>
          <Button size="large">Ver Hoja Oficial</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Client Selection & Meta */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2 lg:col-span-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#0066B3]" />
                Cliente Receptor *
              </label>

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
                </motion.div>
              )}
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="h-5 flex items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-[#0066B3]" />
                    N.º Cotización
                  </label>
                </div>
                <Controller
                  name="numero_cotizacion"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} size="large" placeholder="Número de cotización" className="font-mono font-bold" />
                  )}
                />
              </div>

              <div>
                <div className="h-5 flex items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Fecha de Emisión
                  </label>
                </div>
                <Controller
                  name="fecha_emision"
                  control={control}
                  render={({ field }) => (
                    <Input type="date" size="large" {...field} className="font-mono font-medium" />
                  )}
                />
              </div>

              {isCotizacion && (
                <div>
                  <div className="h-5 flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0066B3]" />
                      Validez / Vencimiento
                    </label>
                    <span className="text-[10px] text-[#0066B3] font-bold">
                      (Auto +30d)
                    </span>
                  </div>
                  <Controller
                    name="fecha_vencimiento"
                    control={control}
                    render={({ field }) => (
                      <Input type="date" size="large" {...field} className="font-mono font-medium" />
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Concepto General del Trabajo */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0066B3] via-[#005494] to-[#004880] p-5 shadow-xl shadow-[#0066B3]/25 text-white space-y-2 border border-sky-400/30">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 fill-amber-300" />
            Título / Concepto General del Servicio o Proyecto *
          </label>
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

        {/* Card 3: Dynamic Table of Open Lines */}
        <div className="glass-panel rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#0066B3]" />
                Líneas Abiertas de Partidas ({fields.length})
              </h3>
            </div>

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

              <Button icon={<ToolOutlined />} onClick={handleAgregarManoObra} className="font-bold">
                + Mano de Obra
              </Button>

              <Button icon={<AppstoreAddOutlined />} onClick={handleAgregarGastables} className="font-bold">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-[#0066B3]/8 text-[#0066B3] border-b border-slate-200 font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-32 text-center">Cantidad</th>
                  <th className="py-3 px-4">Descripción de la Partida / Equipo</th>
                  <th className="py-3 px-4 w-56 min-w-[210px] text-right">Precio / U</th>
                  <th className="py-3 px-4 w-52 min-w-[190px] text-right">Importe</th>
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
                            name={`detalles.${index}.cantidad`}
                            control={control}
                            render={({ field: inputField }) => (
                              <InputNumber
                                min={1}
                                step={1}
                                precision={0}
                                stringMode={false}
                                parser={(val) => (val ? String(val).replace(/\D/g, '') : '')}
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
                                style={{ width: '100%' }}
                                value={inputField.value}
                                onChange={inputField.onChange}
                                className="font-mono font-bold text-center"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4">
                          <Controller
                            name={`detalles.${index}.descripcion`}
                            control={control}
                            render={({ field: inputField }) => (
                              <Input
                                {...inputField}
                                placeholder="Descripción de la partida o material..."
                                className="font-medium"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4 w-56 min-w-[210px] text-right">
                          <Controller
                            name={`detalles.${index}.precio_unitario`}
                            control={control}
                            render={({ field: inputField }) => (
                              <InputNumber
                                min={0}
                                step={100}
                                prefix="RD$"
                                style={{ width: '100%' }}
                                value={inputField.value}
                                onChange={inputField.onChange}
                                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(val: any) => val.replace(/RD\$\s?|\$\s?|(,*)/g, '')}
                                className="font-mono font-bold text-right"
                              />
                            )}
                          />
                        </td>

                        <td className="py-2.5 px-4 w-52 min-w-[190px] text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatDOP(lineTotal)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                          />
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Summary, Notes & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              Notas y Términos de la Propuesta
            </label>
            <Controller
              name="notas"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={4}
                  placeholder="Condiciones de pago, tiempo estimado de entrega o validez..."
                  className="font-medium text-xs"
                />
              )}
            />
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-100/70 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-[#0066B3] text-[10px] font-black uppercase">
                    Obligatorio
                  </span>
                  ITBIS (18%)
                </span>
                <span className="text-[11px] text-slate-500">
                  Aplicado obligatoriamente por normativa fiscal
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatDOP(itbisMonto)}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Partidas:</span>
                <span className="font-bold text-slate-900">{formatDOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ITBIS (18%):</span>
                <span className="font-bold text-slate-900">{formatDOP(itbisMonto)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-950 pt-2 border-t border-slate-200">
                <span>Total:</span>
                <span className="text-[#0066B3] text-2xl font-black">
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
                loading={isSubmitting || updateFacturaMutation.isPending}
                icon={<SaveOutlined />}
                className="bg-[#0066B3] hover:bg-[#004E8A] font-bold"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      </form>

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
          toast.success(`Servicio "${srv.nombre}" insertado.`);
        }}
      />
    </motion.div>
  );
}

export default function EditarDocumentoPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24">
          <MadeleLoader size="lg" text="Inicializando editor de cotizaciones..." />
        </div>
      }
    >
      <EditarContent />
    </React.Suspense>
  );
}
