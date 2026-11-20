'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Tooltip,
  Popconfirm,
  message,
  Empty,
  Spin,
} from 'antd';
import dayjs from 'dayjs';
import {
  Hash,
  Plus,
  ArrowLeft,
  Search,
  Play,
  Pause,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  useSecuenciasNcf,
  useSecuenciasNcfKpis,
  useCreateSecuenciaNcf,
  useUpdateSecuenciaNcf,
  useCambiarEstadoSecuenciaNcf,
  useDeleteSecuenciaNcf,
} from '@/services/clientMainService';
import type { SecuenciaNcf, CreateSecuenciaNcfInput } from '@/types';

const COMPROBANTES_CATALOGO = [
  {
    value: 'E31',
    label: 'E31 - Factura de Crédito Fiscal',
    serie: 'E',
    dgii: '31',
    nombre: 'Factura de Crédito Fiscal',
  },
  {
    value: 'E32',
    label: 'E32 - Factura de Consumo',
    serie: 'E',
    dgii: '32',
    nombre: 'Factura de Consumo',
  },
  {
    value: 'E34',
    label: 'E34 - Nota de Crédito',
    serie: 'E',
    dgii: '34',
    nombre: 'Nota de Crédito',
  },
  {
    value: 'E45',
    label: 'E45 - Comprobante Gubernamental',
    serie: 'E',
    dgii: '45',
    nombre: 'Comprobante Gubernamental',
  },
];

const getNombreComprobante = (r: SecuenciaNcf) => {
  if (r.nombre && r.nombre.trim() && r.nombre !== 'undefined') return r.nombre;
  const match = COMPROBANTES_CATALOGO.find(
    (c) => c.value === r.tipo_comprobante || c.dgii === r.codigo_dgii
  );
  if (match) return match.nombre;
  return `Comprobante Fiscal (${r.tipo_comprobante || r.codigo_dgii})`;
};

export default function SecuenciasNcfPage() {
  const [activeTab, setActiveTab] = useState<'TODOS' | 'ACTIVO' | 'PENDIENTE' | 'AGOTADO' | 'VENCIDO'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<SecuenciaNcf | null>(null);

  const [form] = Form.useForm();

  // Queries & Mutations
  const { data: lotes = [], isLoading, refetch } = useSecuenciasNcf({
    estado: activeTab === 'TODOS' ? undefined : activeTab,
    search: searchTerm || undefined,
  });

  const { data: kpis } = useSecuenciasNcfKpis();
  const createMutation = useCreateSecuenciaNcf();
  const updateMutation = useUpdateSecuenciaNcf();
  const cambiarEstadoMutation = useCambiarEstadoSecuenciaNcf();
  const deleteMutation = useDeleteSecuenciaNcf();

  const handleOpenCreateModal = () => {
    setEditingLote(null);
    form.resetFields();
    form.setFieldsValue({
      tipo_comprobante: 'E31',
      secuencia_desde: 1,
      secuencia_hasta: 100,
      secuencia_actual: 0,
      alerta_minimo: 10,
      estado: 'ACTIVO',
      fecha_vencimiento: dayjs('2028-12-31'),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lote: SecuenciaNcf) => {
    setEditingLote(lote);
    form.resetFields();
    form.setFieldsValue({
      tipo_comprobante: lote.tipo_comprobante,
      secuencia_desde: lote.secuencia_desde,
      secuencia_hasta: lote.secuencia_hasta,
      secuencia_actual: lote.secuencia_actual,
      alerta_minimo: lote.alerta_minimo,
      estado: lote.estado,
      fecha_vencimiento: lote.fecha_vencimiento ? dayjs(lote.fecha_vencimiento) : dayjs('2028-12-31'),
      notas: lote.notas,
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateSecuenciaNcfInput = {
        tipo_comprobante: values.tipo_comprobante,
        secuencia_desde: Number(values.secuencia_desde),
        secuencia_hasta: Number(values.secuencia_hasta),
        secuencia_actual: Number(values.secuencia_actual || 0),
        fecha_vencimiento: values.fecha_vencimiento.format('YYYY-MM-DD'),
        alerta_minimo: Number(values.alerta_minimo || 10),
        estado: values.estado,
        notas: values.notas,
      };

      if (editingLote) {
        await updateMutation.mutateAsync({
          id: editingLote.id,
          data: payload,
        });
        message.success('Lote de secuencias actualizado exitosamente');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Nuevo lote de secuencias registrado exitosamente');
      }

      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || err?.message || 'Error al guardar el lote');
    }
  };

  const handleToggleEstado = async (lote: SecuenciaNcf) => {
    try {
      const nuevoEstado = lote.estado === 'ACTIVO' ? 'PENDIENTE' : 'ACTIVO';
      await cambiarEstadoMutation.mutateAsync({
        id: lote.id,
        estado: nuevoEstado,
      });
      message.success(`Lote ${nuevoEstado === 'ACTIVO' ? 'activado' : 'pausado'} con éxito`);
      refetch();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Lote eliminado exitosamente');
      refetch();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'No se pudo eliminar el lote');
    }
  };

  // Helper para formatear fecha de vencimiento
  const formatearFecha = (f?: string) => {
    if (!f) return '---';
    try {
      const [y, m, d] = f.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return f;
    }
  };

  // Filtrado reactivo en memoria para búsqueda inmediata
  const lotesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return lotes;
    const term = searchTerm.toLowerCase().trim();
    return lotes.filter((l) => {
      const nombre = getNombreComprobante(l).toLowerCase();
      const tipo = (l.tipo_comprobante || '').toLowerCase();
      const codigo = (l.codigo_dgii || '').toLowerCase();
      const ultimo = (l.ultimo_ncf || '').toLowerCase();
      return (
        nombre.includes(term) ||
        tipo.includes(term) ||
        codigo.includes(term) ||
        ultimo.includes(term)
      );
    });
  }, [lotes, searchTerm]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1500px] mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
        <div>
          <Link
            href="/documentos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0066B3] transition-colors mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Volver a Documentos
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0066B3] flex items-center justify-center text-white shadow-sm">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#0066B3]/10 text-[#0066B3] text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <ShieldCheck className="w-3 h-3 text-[#0066B3]" />
                Facturación Electrónica DGII (Ley 32-23)
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Secuencias NCF y Lotes e-CF
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestión y supervisión de rangos de comprobantes fiscales autorizados por la DGII
              </p>
            </div>
          </div>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateModal}
          className="h-10 px-5 bg-[#0066B3] hover:bg-[#004E8A] font-bold rounded-none border-none shadow-sm flex items-center gap-2 text-xs uppercase tracking-wider"
        >
          Nuevo Lote de NCF
        </Button>
      </div>

      {/* 4 KPI Cards (Bordes Rectangulares, Alta Legibilidad) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total */}
        <div className="bg-white border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              TOTAL LOTES
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700">Registrados</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">
            {kpis?.total_lotes ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Lotes fiscales configurados</p>
        </div>

        {/* Card 2: Activos */}
        <div className="bg-white border border-emerald-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              LOTES ACTIVOS
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800">En uso</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 font-mono tracking-tight">
            {kpis?.lotes_activos ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Emisión continua autorizada</p>
        </div>

        {/* Card 3: Pendientes */}
        <div className="bg-white border border-sky-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#0066B3] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0066B3]" />
              LOTES PENDIENTES
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-sky-100 text-sky-800">Reserva</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0066B3] mt-2 font-mono tracking-tight">
            {kpis?.lotes_pendientes ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Listos para activación futura</p>
        </div>

        {/* Card 4: Alertas */}
        <div className="bg-white border border-amber-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              ALERTA / POR AGOTAR
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800">&lt; 10 disp.</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 font-mono tracking-tight">
            {kpis?.alerta_por_agotar ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Próximos a requerir nuevo rango</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Pills Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 shadow-xs overflow-x-auto max-w-full pb-1 scrollbar-none">
          {(['TODOS', 'ACTIVO', 'PENDIENTE', 'AGOTADO', 'VENCIDO'] as const).map((tab) => {
            const labels = {
              TODOS: 'Todos',
              ACTIVO: 'Activos',
              PENDIENTE: 'Pendientes',
              AGOTADO: 'Agotados',
              VENCIDO: 'Vencidos',
            };
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-none ${
                  isSelected
                    ? 'bg-[#0066B3] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, código DGII o nombre..."
            allowClear
            className="pl-9 h-10 bg-white text-slate-900 border-slate-300 rounded-none placeholder:text-slate-400 focus:border-[#0066B3] shadow-xs text-xs font-medium"
          />
        </div>
      </div>

      {/* Lotes Table: High Contrast, Sharp, Professional */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spin size="large" />
            <span className="text-xs font-bold text-slate-500">Cargando secuencias de comprobantes DGII...</span>
          </div>
        ) : lotesFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Empty
              description={
                <div className="space-y-1 mt-2">
                  <p className="text-sm font-bold text-slate-700">No se encontraron lotes de comprobantes</p>
                  <p className="text-xs text-slate-500">
                    {searchTerm
                      ? 'No hay registros que coincidan con el término de búsqueda.'
                      : 'No hay lotes para el estado seleccionado.'}
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tipo Comprobante</th>
                  <th className="py-3 px-3 text-center">Serie</th>
                  <th className="py-3 px-3">Rango Autorizado</th>
                  <th className="py-3 px-4 min-w-[240px]">Secuencia Actual / Consumo</th>
                  <th className="py-3 px-3">Vencimiento</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lotesFiltrados.map((r) => {
                  const nombre = getNombreComprobante(r);
                  const isActivo = r.estado === 'ACTIVO';
                  const isPendiente = r.estado === 'PENDIENTE';
                  const isAgotado = r.estado === 'AGOTADO';
                  const isVencido = r.estado === 'VENCIDO';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-sky-50/40 transition-colors group text-slate-800"
                    >
                      {/* Tipo Comprobante */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs tracking-tight">
                          {nombre}
                        </div>
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-sky-50 text-[#0066B3] border border-sky-200 text-[10px] font-mono font-bold">
                          <span>Código DGII:</span>
                          <span className="font-black">{r.codigo_dgii}</span>
                          <span className="text-slate-400">({r.tipo_comprobante})</span>
                        </div>
                      </td>

                      {/* Serie */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 font-mono font-extrabold text-[10px]">
                          e-CF Electrónico
                        </span>
                      </td>

                      {/* Rango Autorizado */}
                      <td className="py-3 px-3 font-mono">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{Number(r.secuencia_desde).toLocaleString()}</span>
                          <span className="text-[#0066B3] font-bold">➔</span>
                          <span>{Number(r.secuencia_hasta).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
                          {Math.max(1, Number(r.secuencia_hasta) - Number(r.secuencia_desde) + 1).toLocaleString()} autorizados
                        </div>
                      </td>

                      {/* Secuencia Actual / Consumidos */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5 min-w-[200px]">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#0066B3] font-black">
                              Último: <span className="underline">{r.ultimo_ncf || 'Sin emitir'}</span>
                            </span>
                            <span className="text-slate-600 font-bold">
                              {Number(r.restantes).toLocaleString()} restantes
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                r.en_alerta
                                  ? 'bg-amber-500'
                                  : isAgotado
                                  ? 'bg-slate-400'
                                  : 'bg-gradient-to-r from-sky-500 to-[#0066B3]'
                              }`}
                              style={{ width: `${Math.max(2, r.porcentaje_consumido)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>{Number(r.consumidos).toLocaleString()} emitidos</span>
                            <span className="font-bold text-slate-700">{r.porcentaje_consumido}% consumido</span>
                          </div>
                        </div>
                      </td>

                      {/* Vencimiento */}
                      <td className="py-3 px-3 font-mono text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{formatearFecha(r.fecha_vencimiento)}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border ${
                            isActivo
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isPendiente
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : isAgotado
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActivo
                                ? 'bg-emerald-500 animate-pulse'
                                : isPendiente
                                ? 'bg-amber-500'
                                : isAgotado
                                ? 'bg-slate-400'
                                : 'bg-rose-500'
                            }`}
                          />
                          {r.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {isPendiente && (
                            <Tooltip title="Activar este lote para emisión inmediata">
                              <button
                                onClick={() => handleToggleEstado(r)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-emerald-600/20" />
                              </button>
                            </Tooltip>
                          )}

                          {isActivo && (
                            <Tooltip title="Pausar este lote (colocar en reserva)">
                              <button
                                onClick={() => handleToggleEstado(r)}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                              >
                                <Pause className="w-4 h-4 fill-amber-600/20" />
                              </button>
                            </Tooltip>
                          )}

                          <Tooltip title="Editar configuración del lote">
                            <button
                              onClick={() => handleOpenEditModal(r)}
                              className="p-1.5 text-slate-600 hover:text-[#0066B3] hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          {r.secuencia_actual === 0 && (
                            <Popconfirm
                              title="¿Eliminar este lote?"
                              description="Solo es posible eliminar lotes sin comprobantes emitidos."
                              okText="Eliminar"
                              cancelText="Cancelar"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => handleDelete(r.id)}
                            >
                              <button className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Popconfirm>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Registrar o Editar Lote NCF */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-black text-slate-900 pb-2 border-b border-slate-200">
            <Hash className="w-5 h-5 text-[#0066B3]" />
            {editingLote ? 'Editar Lote de Secuencias DGII' : 'Registrar Nuevo Lote de Comprobantes NCF'}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmitModal}
        okText={editingLote ? 'Actualizar Lote' : 'Crear Lote'}
        cancelText="Cancelar"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        centered
        width={560}
      >
        <Form form={form} layout="vertical" className="pt-3">
          <Form.Item
            label={<span className="text-xs font-bold text-slate-700">Tipo de Comprobante DGII</span>}
            name="tipo_comprobante"
            rules={[{ required: true, message: 'Seleccione el tipo de comprobante' }]}
          >
            <Select
              options={COMPROBANTES_CATALOGO}
              disabled={!!editingLote}
              className="font-medium"
              placeholder="Seleccione comprobante"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label={<span className="text-xs font-bold text-slate-700">Secuencia Desde</span>}
              name="secuencia_desde"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                className="w-full font-mono font-bold"
                disabled={!!editingLote && editingLote.secuencia_actual > 0}
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-bold text-slate-700">Secuencia Hasta (Tope)</span>}
              name="secuencia_hasta"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} className="w-full font-mono font-bold" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label={
                <span className="text-xs font-bold text-slate-700">
                  Secuencia Actual (Último emitido)
                </span>
              }
              name="secuencia_actual"
              tooltip="Dejar en 0 si es un lote nuevo que aún no ha emitido comprobantes"
            >
              <InputNumber min={0} style={{ width: '100%' }} className="w-full font-mono font-bold" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-bold text-slate-700">Alerta Restante</span>}
              name="alerta_minimo"
              tooltip="Dispara alerta cuando queden esta cantidad o menos comprobantes disponibles"
            >
              <InputNumber min={1} style={{ width: '100%' }} className="w-full font-bold" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label={<span className="text-xs font-bold text-slate-700">Fecha de Vencimiento DGII</span>}
              name="fecha_vencimiento"
              rules={[{ required: true, message: 'Seleccione fecha de vencimiento' }]}
            >
              <DatePicker format="DD/MM/YYYY" className="w-full font-mono" />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-bold text-slate-700">Estado Inicial</span>}
              name="estado"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'ACTIVO', label: 'ACTIVO (Para emisión inmediata)' },
                  { value: 'PENDIENTE', label: 'PENDIENTE (En reserva)' },
                  ...(editingLote
                    ? [
                        { value: 'AGOTADO', label: 'AGOTADO' },
                        { value: 'VENCIDO', label: 'VENCIDO' },
                      ]
                    : []),
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-xs font-bold text-slate-700">Notas / Autorización DGII</span>}
            name="notas"
          >
            <Input.TextArea
              rows={2}
              placeholder="Ej: Autorizado según oficio DGII o lote de pruebas TesteCF"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
