import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Cliente,
  CreateClienteDto,
  UpdateClienteDto,
  GetClientesParams,
  EstadoCuentaResumen,
  Factura,
  CreateFacturaDto,
  UpdateFacturaDto,
  ConvertirFacturaDto,
  AnularDocumentoDto,
  GetFacturasParams,
  SiguienteSecuenciaResponse,
  Cobro,
  CreateCobroDto,
  GetCobrosParams,
  Equipo,
  CreateEquipoDto,
  UpdateEquipoDto,
  AsignarEquipoDto,
  GetEquiposParams,
  DashboardKpis,
  Servicio,
  CreateServicioDto,
  GetServiciosParams,
  DatosEmpresa,
  PaginatedResponse,
  SecuenciaNcf,
  SecuenciasNcfKpis,
  CreateSecuenciaNcfInput,
  UpdateSecuenciaNcfInput,
  ProximoComprobanteVista,
  ConsultaRncResponse,
} from '@/types';

export const clientAxios = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// Client API Functions
// ==========================================
export const clientApi = {
  // Clientes
  getClientes: async (params?: GetClientesParams): Promise<PaginatedResponse<Cliente>> => {
    const res = await clientAxios.get<PaginatedResponse<Cliente>>('/clientes', { params });
    return res.data;
  },

  getCliente: async (id: string): Promise<Cliente> => {
    const res = await clientAxios.get<Cliente>(`/clientes/${id}`);
    return res.data;
  },

  getEstadoCuenta: async (id: string): Promise<EstadoCuentaResumen> => {
    const res = await clientAxios.get<EstadoCuentaResumen>(`/clientes/${id}/estadoCuenta`);
    return res.data;
  },

  consultarRnc: async (rnc: string): Promise<ConsultaRncResponse> => {
    const clean = (rnc || '').replace(/\D/g, '');
    const res = await clientAxios.get<ConsultaRncResponse>(`/clientes/consulta-rnc/${clean}`);
    return res.data;
  },

  createCliente: async (data: CreateClienteDto): Promise<Cliente> => {
    const res = await clientAxios.post<Cliente>('/clientes', data);
    return res.data;
  },

  updateCliente: async (id: string, data: UpdateClienteDto): Promise<Cliente> => {
    const res = await clientAxios.patch<Cliente>(`/clientes/${id}`, data);
    return res.data;
  },

  deleteCliente: async (id: string): Promise<Cliente> => {
    const res = await clientAxios.delete<Cliente>(`/clientes/${id}`);
    return res.data;
  },

  getSiguienteCodigoCliente: async (): Promise<{ siguiente: string }> => {
    const res = await clientAxios.get<{ siguiente: string }>('/clientes/siguienteCodigo');
    return res.data;
  },

  // Facturas
  getFacturas: async (params?: GetFacturasParams): Promise<PaginatedResponse<Factura>> => {
    const res = await clientAxios.get<PaginatedResponse<Factura>>('/facturas', { params });
    return res.data;
  },

  getFactura: async (id: string): Promise<Factura> => {
    const res = await clientAxios.get<Factura>(`/facturas/${id}`);
    return res.data;
  },

  getSiguienteSecuencia: async (
    tipo: 'COTIZACION' | 'FACTURA',
  ): Promise<SiguienteSecuenciaResponse> => {
    const res = await clientAxios.get<SiguienteSecuenciaResponse>(
      '/facturas/siguienteSecuencia',
      { params: { tipo } },
    );
    return res.data;
  },

  getPendientesCliente: async (clienteId: string): Promise<Factura[]> => {
    const res = await clientAxios.get<Factura[]>(`/facturas/pendientes/cliente/${clienteId}`);
    return res.data;
  },

  createFactura: async (data: CreateFacturaDto): Promise<Factura> => {
    const res = await clientAxios.post<Factura>('/facturas', data);
    return res.data;
  },

  updateFactura: async (id: string, data: UpdateFacturaDto): Promise<Factura> => {
    const res = await clientAxios.patch<Factura>(`/facturas/${id}`, data);
    return res.data;
  },

  convertirAFactura: async (id: string, data: ConvertirFacturaDto): Promise<Factura> => {
    const res = await clientAxios.post<Factura>(`/facturas/${id}/convertirAFactura`, data);
    return res.data;
  },

  anularFactura: async (id: string, data?: AnularDocumentoDto): Promise<Factura> => {
    const res = await clientAxios.patch<Factura>(`/facturas/${id}/anular`, data || {});
    return res.data;
  },

  // Facturación Electrónica DGII (MSeller ECF)
  sincronizarECF: async (id: string): Promise<any> => {
    const res = await clientAxios.post(`/facturas/${id}/sincronizar-ecf`);
    return res.data;
  },

  getEstadoECF: async (id: string): Promise<any> => {
    const res = await clientAxios.get(`/facturas/${id}/estado-ecf`);
    return res.data;
  },

  getECFConfig: async (): Promise<any> => {
    const res = await clientAxios.get('/ecf/config');
    return res.data;
  },

  cambiarAmbienteECF: async (ambiente: string): Promise<any> => {
    const res = await clientAxios.post('/ecf/ambiente', { ambiente });
    return res.data;
  },

  // Cobros
  getCobros: async (params?: GetCobrosParams): Promise<PaginatedResponse<Cobro>> => {
    const res = await clientAxios.get<PaginatedResponse<Cobro>>('/cobros', { params });
    return res.data;
  },

  getCobro: async (id: string): Promise<Cobro> => {
    const res = await clientAxios.get<Cobro>(`/cobros/${id}`);
    return res.data;
  },

  getSiguienteRecibo: async (): Promise<SiguienteSecuenciaResponse> => {
    const res = await clientAxios.get<SiguienteSecuenciaResponse>(
      '/cobros/siguienteRecibo',
    );
    return res.data;
  },

  createCobro: async (data: CreateCobroDto): Promise<Cobro> => {
    const res = await clientAxios.post<Cobro>('/cobros', data);
    return res.data;
  },

  anularCobro: async (id: string, data?: AnularDocumentoDto): Promise<Cobro> => {
    const res = await clientAxios.patch<Cobro>(`/cobros/${id}/anular`, data || {});
    return res.data;
  },

  // Equipos
  getEquipos: async (params?: GetEquiposParams): Promise<PaginatedResponse<Equipo>> => {
    const res = await clientAxios.get<PaginatedResponse<Equipo>>('/equipos', { params });
    return res.data;
  },

  getEquipo: async (id: string): Promise<Equipo> => {
    const res = await clientAxios.get<Equipo>(`/equipos/${id}`);
    return res.data;
  },

  createEquipo: async (data: CreateEquipoDto): Promise<Equipo> => {
    const res = await clientAxios.post<Equipo>('/equipos', data);
    return res.data;
  },

  updateEquipo: async (id: string, data: UpdateEquipoDto): Promise<Equipo> => {
    const res = await clientAxios.patch<Equipo>(`/equipos/${id}`, data);
    return res.data;
  },

  deleteEquipo: async (id: string): Promise<Equipo> => {
    const res = await clientAxios.delete<Equipo>(`/equipos/${id}`);
    return res.data;
  },

  asignarEquipo: async (id: string, data: AsignarEquipoDto): Promise<Equipo> => {
    const res = await clientAxios.post<Equipo>(`/equipos/${id}/asignar`, data);
    return res.data;
  },

  desasignarEquipo: async (id: string): Promise<Equipo> => {
    const res = await clientAxios.post<Equipo>(`/equipos/${id}/desasignar`);
    return res.data;
  },

  // Dashboard & KPIs
  getDashboardKpis: async (): Promise<DashboardKpis> => {
    const res = await clientAxios.get<DashboardKpis>('/dashboard/kpis');
    return res.data;
  },

  // Servicios
  getServicios: async (params?: GetServiciosParams): Promise<PaginatedResponse<Servicio>> => {
    const res = await clientAxios.get<PaginatedResponse<Servicio>>('/servicios', { params });
    return res.data;
  },

  getServicio: async (id: string): Promise<Servicio> => {
    const res = await clientAxios.get<Servicio>(`/servicios/${id}`);
    return res.data;
  },

  createServicio: async (data: CreateServicioDto): Promise<Servicio> => {
    const res = await clientAxios.post<Servicio>('/servicios', data);
    return res.data;
  },

  // Configuración de Empresa
  getDatosEmpresa: async (): Promise<DatosEmpresa> => {
    const res = await clientAxios.get<DatosEmpresa>('/configuracion/empresa');
    return res.data;
  },

  // Secuencias NCF y Lotes e-CF
  getSecuenciasNcf: async (params?: { estado?: string; serie?: string; search?: string }): Promise<SecuenciaNcf[]> => {
    const res = await clientAxios.get<SecuenciaNcf[]>('/secuencias-ncf', { params });
    return res.data;
  },

  getSecuenciasNcfKpis: async (): Promise<SecuenciasNcfKpis> => {
    const res = await clientAxios.get<SecuenciasNcfKpis>('/secuencias-ncf/kpis');
    return res.data;
  },

  getProximoComprobante: async (tipo: string): Promise<ProximoComprobanteVista> => {
    const res = await clientAxios.get<ProximoComprobanteVista>('/secuencias-ncf/proximo', {
      params: { tipo },
    });
    return res.data;
  },

  createSecuenciaNcf: async (data: CreateSecuenciaNcfInput): Promise<SecuenciaNcf> => {
    const res = await clientAxios.post<SecuenciaNcf>('/secuencias-ncf', data);
    return res.data;
  },

  updateSecuenciaNcf: async (id: string, data: UpdateSecuenciaNcfInput): Promise<SecuenciaNcf> => {
    const res = await clientAxios.patch<SecuenciaNcf>(`/secuencias-ncf/${id}`, data);
    return res.data;
  },

  cambiarEstadoSecuenciaNcf: async (id: string, estado: 'ACTIVO' | 'PENDIENTE'): Promise<SecuenciaNcf> => {
    const res = await clientAxios.patch<SecuenciaNcf>(`/secuencias-ncf/${id}/estado`, { estado });
    return res.data;
  },

  deleteSecuenciaNcf: async (id: string): Promise<{ success: boolean; mensaje: string }> => {
    const res = await clientAxios.delete<{ success: boolean; mensaje: string }>(`/secuencias-ncf/${id}`);
    return res.data;
  },
};

// ==========================================
// TanStack Query Hooks
// ==========================================

// Dashboard Hooks
export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => clientApi.getDashboardKpis(),
    refetchInterval: 30000,
  });
}

// Configuración Empresa Hooks
export function useDatosEmpresa() {
  return useQuery({
    queryKey: ['configuracion-empresa'],
    queryFn: () => clientApi.getDatosEmpresa(),
    staleTime: 1000 * 60 * 30, // 30 min cache
  });
}

// Clientes Hooks
export function useClientes(params?: GetClientesParams) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => clientApi.getClientes(params),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientApi.getCliente(id),
    enabled: !!id,
  });
}

export function useEstadoCuenta(id: string) {
  return useQuery({
    queryKey: ['estado-cuenta', id],
    queryFn: () => clientApi.getEstadoCuenta(id),
    enabled: !!id,
  });
}

export function useSiguienteCodigoCliente() {
  return useQuery({
    queryKey: ['siguiente-codigo-cliente'],
    queryFn: () => clientApi.getSiguienteCodigoCliente(),
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClienteDto) => clientApi.createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteDto }) =>
      clientApi.updateCliente(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
}

// Facturas Hooks
export function useFacturas(params?: GetFacturasParams) {
  return useQuery({
    queryKey: ['facturas', params],
    queryFn: () => clientApi.getFacturas(params),
  });
}

export function useFactura(id: string) {
  return useQuery({
    queryKey: ['factura', id],
    queryFn: () => clientApi.getFactura(id),
    enabled: !!id,
  });
}

export function useSiguienteSecuencia(tipo: 'COTIZACION' | 'FACTURA') {
  return useQuery({
    queryKey: ['siguiente-secuencia', tipo],
    queryFn: () => clientApi.getSiguienteSecuencia(tipo),
  });
}

export function useFacturasPendientes(clienteId: string) {
  return useQuery({
    queryKey: ['facturas-pendientes', clienteId],
    queryFn: () => clientApi.getPendientesCliente(clienteId),
    enabled: !!clienteId,
  });
}

export function useCreateFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacturaDto) => clientApi.createFactura(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['estado-cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['siguiente-secuencia'] });
    },
  });
}

export function useUpdateFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFacturaDto }) =>
      clientApi.updateFactura(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['factura', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
}

export function useConvertirFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConvertirFacturaDto }) =>
      clientApi.convertirAFactura(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['factura', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['estado-cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['siguiente-secuencia'] });
    },
  });
}

export function useAnularFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: AnularDocumentoDto }) =>
      clientApi.anularFactura(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['factura', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['estado-cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
}

// Cobros Hooks
export function useCobros(params?: GetCobrosParams) {
  return useQuery({
    queryKey: ['cobros', params],
    queryFn: () => clientApi.getCobros(params),
  });
}

export function useCobro(id: string) {
  return useQuery({
    queryKey: ['cobro', id],
    queryFn: () => clientApi.getCobro(id),
    enabled: !!id,
  });
}

export function useSiguienteRecibo() {
  return useQuery({
    queryKey: ['siguiente-recibo'],
    queryFn: () => clientApi.getSiguienteRecibo(),
  });
}

export function useCreateCobro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCobroDto) => clientApi.createCobro(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobros'] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['estado-cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['siguiente-recibo'] });
    },
  });
}

export function useAnularCobro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: AnularDocumentoDto }) =>
      clientApi.anularCobro(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobros'] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['estado-cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
}

// Equipos Hooks
export function useEquipos(params?: GetEquiposParams) {
  return useQuery({
    queryKey: ['equipos', params],
    queryFn: () => clientApi.getEquipos(params),
  });
}

export function useEquipo(id: string) {
  return useQuery({
    queryKey: ['equipo', id],
    queryFn: () => clientApi.getEquipo(id),
    enabled: !!id,
  });
}

// Servicios Hooks
export function useServicios(params?: GetServiciosParams) {
  return useQuery({
    queryKey: ['servicios', params],
    queryFn: () => clientApi.getServicios(params),
  });
}

export function useServicio(id: string) {
  return useQuery({
    queryKey: ['servicio', id],
    queryFn: () => clientApi.getServicio(id),
    enabled: !!id,
  });
}

export function useCreateServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServicioDto) => clientApi.createServicio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
    },
  });
}

// Secuencias NCF Hooks
export function useSecuenciasNcf(params?: { estado?: string; serie?: string; search?: string }) {
  return useQuery({
    queryKey: ['secuencias-ncf', params],
    queryFn: () => clientApi.getSecuenciasNcf(params),
  });
}

export function useSecuenciasNcfKpis() {
  return useQuery({
    queryKey: ['secuencias-ncf-kpis'],
    queryFn: () => clientApi.getSecuenciasNcfKpis(),
  });
}

export function useProximoComprobante(tipo?: string) {
  return useQuery({
    queryKey: ['proximo-comprobante', tipo],
    queryFn: () => clientApi.getProximoComprobante(tipo || 'E31'),
    enabled: !!tipo,
  });
}

export function useCreateSecuenciaNcf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSecuenciaNcfInput) => clientApi.createSecuenciaNcf(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf'] });
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['proximo-comprobante'] });
    },
  });
}

export function useUpdateSecuenciaNcf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSecuenciaNcfInput }) =>
      clientApi.updateSecuenciaNcf(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf'] });
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['proximo-comprobante'] });
    },
  });
}

export function useCambiarEstadoSecuenciaNcf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVO' | 'PENDIENTE' }) =>
      clientApi.cambiarEstadoSecuenciaNcf(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf'] });
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['proximo-comprobante'] });
    },
  });
}

export function useDeleteSecuenciaNcf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.deleteSecuenciaNcf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf'] });
      queryClient.invalidateQueries({ queryKey: ['secuencias-ncf-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['proximo-comprobante'] });
    },
  });
}
