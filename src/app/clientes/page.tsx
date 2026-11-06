'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FileDoneOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import { ClienteModal } from '@/components/clientes/ClienteModal';
import { EstadoCuentaDrawer } from '@/components/clientes/EstadoCuentaDrawer';
import { CobroModal } from '@/components/documentos/CobroModal';
import { MadeleLoader } from '@/components/ui/MadeleLoader';
import { formatDOP, formatDate } from '@/lib/utils';
import type { Cliente, Factura } from '@/lib/types';
import {
  Users,
  Building,
  User,
  Phone,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';

function ClientesContent() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
  const [selectedClienteForEstado, setSelectedClienteForEstado] = useState<Cliente | null>(null);
  const [facturaToCobrar, setFacturaToCobrar] = useState<Factura | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.getClientes({ limit: 100 }),
  });

  const filteredClientes = useMemo(() => {
    if (!data?.data) return [];
    if (!searchTerm.trim()) return data.data;
    const term = searchTerm.toLowerCase();
    return data.data.filter(
      (c) =>
        c.nombre_razon_social.toLowerCase().includes(term) ||
        (c.persona_contacto && c.persona_contacto.toLowerCase().includes(term)) ||
        (c.documento_identidad && c.documento_identidad.toLowerCase().includes(term)) ||
        c.codigo_cliente.toLowerCase().includes(term),
    );
  }, [data?.data, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0066B3]/10 text-[#0066B3] text-[10px] font-bold uppercase tracking-wider mb-1">
            <Users className="w-3 h-3 text-[#0066B3]" />
            Directorio Comercial
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Clientes y Balances
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta rápida de condominios, empresas, administradores y estados de cuenta en tiempo real
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            setClienteToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-[#0066B3] hover:bg-[#004E8A] font-bold rounded-2xl shadow-lg shadow-[#0066B3]/25 flex items-center justify-center"
        >
          Registrar Cliente
        </Button>
      </div>

      {/* Filter and Search Bar with Ant Design Input */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            allowClear
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por edificio, empresa, persona de contacto, RNC o código..."
            className="font-medium"
          />
        </div>
        <div className="text-xs text-slate-600 font-bold px-3.5 py-2 bg-slate-100 rounded-xl whitespace-nowrap text-center sm:text-left">
          {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass-panel rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20">
            <MadeleLoader
              size="md"
              text="Cargando directorio de clientes..."
              subtext="Consultando balances y cuentas comerciales"
            />
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No se encontraron clientes</p>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'Intente con otro término de búsqueda' : 'Registre su primer cliente'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Código / Cliente</th>
                  <th className="py-3.5 px-4">Persona de Contacto</th>
                  <th className="py-3.5 px-4">RNC / Cédula</th>
                  <th className="py-3.5 px-4">Teléfono & Ubicación</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-sky-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedClienteForEstado(cliente)}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-100 to-sky-50 text-[#0066B3] flex items-center justify-center font-bold text-xs shrink-0 border border-sky-200 group-hover:scale-105 transition-transform shadow-xs">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-[#0066B3] transition-colors text-xs">
                            {cliente.nombre_razon_social}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 font-bold">
                            {cliente.codigo_cliente}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {cliente.persona_contacto ? (
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <User className="w-3.5 h-3.5 text-[#0066B3] shrink-0" />
                          <span>{cliente.persona_contacto}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No especificado</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {cliente.documento_identidad ? (
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {cliente.documento_identidad}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Consumidor Final</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-600 space-y-0.5">
                      {cliente.telefono && (
                        <div className="flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cliente.telefono}</span>
                        </div>
                      )}
                      {cliente.direccion && (
                        <p className="text-[11px] text-slate-400 max-w-[200px] truncate">
                          {cliente.direccion}
                        </p>
                      )}
                    </td>

                    <td
                      className="py-4 px-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedClienteForEstado(cliente)}
                          className="font-bold text-[#0066B3] border-sky-200 hover:bg-sky-50 flex items-center gap-1"
                        >
                          Estado de Cuenta
                        </Button>

                        <Tooltip title="Editar cliente">
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                              setClienteToEdit(cliente);
                              setIsModalOpen(true);
                            }}
                            shape="circle"
                          />
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clienteToEdit={clienteToEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
        }}
      />

      <EstadoCuentaDrawer
        cliente={selectedClienteForEstado}
        isOpen={!!selectedClienteForEstado}
        onClose={() => setSelectedClienteForEstado(null)}
        onCobrarFactura={(factura) => {
          setFacturaToCobrar(factura);
        }}
      />

      {facturaToCobrar && (
        <CobroModal
          factura={facturaToCobrar}
          isOpen={!!facturaToCobrar}
          onClose={() => setFacturaToCobrar(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            queryClient.invalidateQueries({ queryKey: ['estado-cuenta'] });
            queryClient.invalidateQueries({ queryKey: ['facturas'] });
          }}
        />
      )}
    </motion.div>
  );
}

export default function ClientesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando directorio de clientes...</div>}>
      <ClientesContent />
    </React.Suspense>
  );
}
