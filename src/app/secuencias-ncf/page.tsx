'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Progress,
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
  Sparkles,
  ShieldCheck,
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
  { value: 'E31', label: 'E31 - Factura de Crédito Fiscal Electrónica', serie: 'E', dgii: '31' },
  { value: 'E32', label: 'E32 - Factura de Consumo Electrónica', serie: 'E', dgii: '32' },
  { value: 'E34', label: 'E34 - Nota de Crédito Electrónica', serie: 'E', dgii: '34' },
  { value: 'E45', label: 'E45 - Gubernamental Electrónico', serie: 'E', dgii: '45' },
];

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

  // Formatted date helper
  const formatearFecha = (f?: string) => {
    if (!f) return '---';
    try {
      const [y, m, d] = f.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return f;
    }
  };

  const columns = [
    {
      title: 'Tipo Comprobante',
      key: 'tipo_comprobante',
      render: (_: any, r: SecuenciaNcf) => (
        <div>
          <div className="font-bold text-white text-[13px] tracking-tight">{r.nombre}</div>
          <div className="text-[11px] font-mono text-sky-400 mt-0.5">
            Código DGII: <span className="font-bold text-sky-300">{r.codigo_dgii}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Serie',
      key: 'serie',
      width: 140,
      render: (_: any, r: SecuenciaNcf) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
            'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
          }`}
        >
          e-CF Electrónico
        </span>
      ),
    },
    {
      title: 'Rango Autorizado',
      key: 'rango',
      width: 150,
      render: (_: any, r: SecuenciaNcf) => (
        <div className="font-mono text-xs font-bold text-slate-200">
          <span>{r.secuencia_desde}</span>
          <span className="text-slate-500 mx-2">➔</span>
          <span>{r.secuencia_hasta}</span>
        </div>
      ),
    },
    {
      title: 'Secuencia Actual / Consumidos',
      key: 'secuencia_actual',
      width: 290,
      render: (_: any, r: SecuenciaNcf) => (
        <div className="space-y-1.5 min-w-[220px]">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-sky-300 font-bold">
              Último: <span className="underline">{r.ultimo_ncf || 'Sin emitir'}</span>
            </span>
            <span className="text-slate-400 font-medium">
              {r.restantes} restantes
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                r.en_alerta
                  ? 'bg-amber-400'
                  : r.estado === 'AGOTADO'
                  ? 'bg-slate-600'
                  : 'bg-gradient-to-r from-emerald-500 to-sky-400'
              }`}
              style={{ width: `${Math.max(2, r.porcentaje_consumido)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Vencimiento',
      key: 'fecha_vencimiento',
      width: 130,
      render: (_: any, r: SecuenciaNcf) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{formatearFecha(r.fecha_vencimiento)}</span>
        </div>
      ),
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 120,
      render: (_: any, r: SecuenciaNcf) => {
        let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
        let dotClass = 'bg-slate-400';

        if (r.estado === 'ACTIVO') {
          badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';
          dotClass = 'bg-emerald-400 animate-pulse';
        } else if (r.estado === 'PENDIENTE') {
          badgeClass = 'bg-sky-950/80 text-sky-300 border-sky-600/50';
          dotClass = 'bg-sky-400';
        } else if (r.estado === 'AGOTADO') {
          badgeClass = 'bg-slate-900 text-slate-400 border-slate-800';
          dotClass = 'bg-slate-500';
        } else if (r.estado === 'VENCIDO') {
          badgeClass = 'bg-rose-950/80 text-rose-300 border-rose-600/50';
          dotClass = 'bg-rose-400';
        }

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {r.estado}
          </span>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 110,
      render: (_: any, r: SecuenciaNcf) => (
        <div className="flex items-center gap-1">
          {r.estado === 'PENDIENTE' && (
            <Tooltip title="Activar este lote">
              <button
                onClick={() => handleToggleEstado(r)}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition-colors"
              >
                <Play className="w-4 h-4 fill-emerald-400/20" />
              </button>
            </Tooltip>
          )}

          {r.estado === 'ACTIVO' && (
            <Tooltip title="Pausar este lote">
              <button
                onClick={() => handleToggleEstado(r)}
                className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 transition-colors"
              >
                <Pause className="w-4 h-4 fill-amber-400/20" />
              </button>
            </Tooltip>
          )}

          <Tooltip title="Editar configuración del lote">
            <button
              onClick={() => handleOpenEditModal(r)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
              <button className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-8">
      <div className="max-w-[1500px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/documentos"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Documentos
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Secuencias NCF y Lotes e-CF
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Gestión de rangos de comprobantes autorizados por la DGII
                </p>
              </div>
            </div>
          </div>

          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
            className="h-10 px-5 bg-gradient-to-r from-sky-500 to-[#0066B3] hover:from-sky-400 hover:to-[#005596] font-bold rounded-xl border-none shadow-lg shadow-sky-500/25 flex items-center gap-2 text-sm"
          >
            Nuevo Lote de NCF
          </Button>
        </div>

        {/* 4 KPI Cards (Bordes Rectangulares) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total */}
          <div className="bg-[#0D1527] border border-slate-800/80 p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              TOTAL LOTES
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5 font-mono">
              {kpis?.total_lotes ?? 0}
            </div>
          </div>

          {/* Card 2: Activos */}
          <div className="bg-[#0D1527] border border-emerald-900/40 p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              LOTES ACTIVOS
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1.5 font-mono">
              {kpis?.lotes_activos ?? 0}
            </div>
          </div>

          {/* Card 3: Pendientes */}
          <div className="bg-[#0D1527] border border-sky-900/40 p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              LOTES PENDIENTES
            </div>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1.5 font-mono">
              {kpis?.lotes_pendientes ?? 0}
            </div>
          </div>

          {/* Card 4: Alertas */}
          <div className="bg-[#0D1527] border border-amber-900/40 p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ALERTA / POR AGOTAR
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1.5 font-mono">
              {kpis?.alerta_por_agotar ?? 0}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* Pills Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0D1527] p-1 border border-slate-800/80 overflow-x-auto">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por tipo o código"
              allowClear
              className="pl-9 h-9 bg-[#0D1527] text-white border-slate-800 rounded-xl placeholder:text-slate-500 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Lotes Table */}
        <div className="bg-[#0D1527] border border-slate-800/80 overflow-hidden shadow-xl rounded-none">
          <Table
            columns={columns as any}
            dataSource={lotes}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            locale={{
              emptyText: (
                <div className="py-12 text-center text-slate-400">
                  <Empty
                    description={
                      <span className="text-slate-400 font-medium">
                        No se encontraron lotes de comprobantes para el filtro seleccionado
                      </span>
                    }
                  />
                </div>
              ),
            }}
            rowClassName={() => 'border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors'}
          />
        </div>
      </div>

      {/* Modal: Registrar o Editar Lote NCF */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-black text-slate-900 pb-2 border-b border-slate-100">
            <Hash className="w-5 h-5 text-sky-600" />
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
