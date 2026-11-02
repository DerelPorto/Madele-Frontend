'use client';

import React, { useState } from 'react';
import { Modal, Input, Button, Table, Tag, Form, InputNumber } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  CheckOutlined,
  BookOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useServicios, useCreateServicio } from '@/services/clientMainService';
import { formatDOP, extractErrorMessage } from '@/lib/utils';
import { useToast } from '@/providers/ToastProvider';
import type { Servicio } from '@/types';

interface CatalogoServiciosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectServicio: (servicio: Servicio) => void;
}

export function CatalogoServiciosModal({
  isOpen,
  onClose,
  onSelectServicio,
}: CatalogoServiciosModalProps) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form] = Form.useForm();

  const { data: serviciosData, isLoading, refetch } = useServicios({
    activo: true,
    search: searchTerm || undefined,
  });

  const createServicioMutation = useCreateServicio();

  const servicios = serviciosData?.data || [];

  const handleCreateServicio = async (values: any) => {
    try {
      const nuevo = await createServicioMutation.mutateAsync({
        codigo: values.codigo?.trim() || undefined,
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || undefined,
        precio: Number(values.precio),
        activo: true,
      });
      toast.success(`Servicio "${nuevo.nombre}" guardado en el catálogo.`);
      form.resetFields();
      setIsCreating(false);
      refetch();
    } catch (err: any) {
      toast.error(extractErrorMessage(err), 'No se pudo crear el servicio');
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        setIsCreating(false);
        onClose();
      }}
      footer={null}
      width={720}
      title={
        <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
          <BookOutlined className="text-[#0066B3]" />
          <span>Catálogo de Servicios Frecuentes</span>
        </div>
      }
      destroyOnClose
    >
      <div className="space-y-4 pt-2">
        {/* Search bar & Create toggle button */}
        <div className="flex items-center justify-between gap-3">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder="Buscar por nombre o código de servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className="font-medium"
          />

          <Button
            type={isCreating ? 'default' : 'primary'}
            icon={<PlusOutlined />}
            onClick={() => setIsCreating(!isCreating)}
            className={!isCreating ? 'bg-[#0066B3] font-bold' : 'font-bold'}
          >
            {isCreating ? 'Ver Lista' : 'Nuevo Servicio'}
          </Button>
        </div>

        {/* Create new service inline form */}
        {isCreating && (
          <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200/80 space-y-3">
            <div className="text-xs font-bold text-[#0066B3] uppercase tracking-wide flex items-center gap-1.5">
              <ThunderboltOutlined />
              <span>Registrar Servicio Frecuente para Reutilizar</span>
            </div>

            <Form form={form} layout="vertical" onFinish={handleCreateServicio}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Form.Item
                  label={<span className="text-xs font-bold text-slate-700">Código</span>}
                  name="codigo"
                >
                  <Input placeholder="Código (opcional)" className="font-mono font-bold" />
                </Form.Item>

                <Form.Item
                  label={<span className="text-xs font-bold text-slate-700">Nombre / Tarea *</span>}
                  name="nombre"
                  rules={[{ required: true, message: 'Ingrese el nombre del servicio' }]}
                  className="sm:col-span-2"
                >
                  <Input placeholder="Nombre del servicio o tarea..." className="font-bold" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Form.Item
                  label={<span className="text-xs font-bold text-slate-700">Precio Estándar (DOP) *</span>}
                  name="precio"
                  rules={[{ required: true, message: 'Indique el precio' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    formatter={(val) => `$ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(val: any) => val.replace(/\$\s?|(,*)/g, '')}
                    className="font-mono font-bold"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-xs font-bold text-slate-700">Descripción / Alcance</span>}
                  name="descripcion"
                  className="sm:col-span-2"
                >
                  <Input placeholder="Descripción o alcance del servicio..." />
                </Form.Item>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button onClick={() => setIsCreating(false)}>Cancelar</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createServicioMutation.isPending}
                  className="bg-[#0066B3] font-bold"
                >
                  Guardar en Catálogo
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* Services List Table */}
        {!isCreating && (
          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Cargando catálogo...</div>
            ) : servicios.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No hay servicios encontrados. Puedes registrar uno con el botón &quot;Nuevo Servicio&quot;.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Servicio / Descripción</th>
                    <th className="py-2.5 px-3 text-right">Precio DOP</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {servicios.map((srv) => (
                    <tr key={srv.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-600">
                        {srv.codigo ? <Tag color="blue">{srv.codigo}</Tag> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{srv.nombre}</div>
                        {srv.descripcion && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{srv.descripcion}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatDOP(srv.precio)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={() => {
                            onSelectServicio(srv);
                            onClose();
                          }}
                          className="bg-[#0066B3] hover:bg-[#004E8A] font-bold text-xs"
                        >
                          Insertar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
