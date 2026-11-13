import axios, { AxiosError } from 'axios';
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

const BACKEND_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000';

export const serverAxios = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export class ServiceError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleAxiosError(error: unknown, defaultMessage: string): never {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string | string[]; error?: string }>;
    const status = err.response?.status || 500;
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      defaultMessage;

    const formattedMessage = Array.isArray(msg) ? msg.join(', ') : msg;
    throw new ServiceError(formattedMessage, status, err.response?.data);
  }

  throw new ServiceError(defaultMessage, 500, error);
}

export const mainService = {
  // ==========================================
  // Clientes
  // ==========================================
  clientes: {
    findAll: async (params?: GetClientesParams): Promise<PaginatedResponse<Cliente>> => {
      try {
        const res = await serverAxios.get<PaginatedResponse<Cliente>>('/clientes', {
          params,
        });
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al obtener listado de clientes');
      }
    },

    findOne: async (id: string): Promise<Cliente> => {
      try {
        const res = await serverAxios.get<Cliente>(`/clientes/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al obtener cliente ${id}`);
      }
    },

    getSiguienteCodigo: async (): Promise<{ siguiente: string }> => {
      try {
        const res = await serverAxios.get<{ siguiente: string }>('/clientes/siguiente-codigo');
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al obtener siguiente código de cliente');
      }
    },

    consultarRnc: async (rnc: string): Promise<ConsultaRncResponse> => {
      try {
        const clean = (rnc || '').replace(/\D/g, '');
        const res = await serverAxios.get<ConsultaRncResponse>(`/clientes/consulta-rnc/${clean}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al consultar RNC en la DGII');
      }
    },

    create: async (data: CreateClienteDto): Promise<Cliente> => {
      try {
        const res = await serverAxios.post<Cliente>('/clientes', data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al registrar nuevo cliente');
      }
    },

    update: async (id: string, data: UpdateClienteDto): Promise<Cliente> => {
      try {
        const res = await serverAxios.patch<Cliente>(`/clientes/${id}`, data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al actualizar cliente ${id}`);
      }
    },

    remove: async (id: string): Promise<Cliente> => {
      try {
        const res = await serverAxios.delete<Cliente>(`/clientes/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al desactivar cliente ${id}`);
      }
    },

    getEstadoCuenta: async (id: string): Promise<EstadoCuentaResumen> => {
      try {
        const res = await serverAxios.get<EstadoCuentaResumen>(
          `/clientes/${id}/estado-cuenta`,
        );
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al consultar estado de cuenta del cliente ${id}`);
      }
    },
  },

  // ==========================================
  // Facturas y Cotizaciones
  // ==========================================
  facturas: {
    findAll: async (params?: GetFacturasParams): Promise<PaginatedResponse<Factura>> => {
      try {
        const res = await serverAxios.get<PaginatedResponse<Factura>>('/facturas', {
          params,
        });
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al obtener documentos');
      }
    },

    findOne: async (id: string): Promise<Factura> => {
      try {
        const res = await serverAxios.get<Factura>(`/facturas/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al obtener documento ${id}`);
      }
    },

    getSiguienteSecuencia: async (
      tipo: 'COTIZACION' | 'FACTURA',
    ): Promise<SiguienteSecuenciaResponse> => {
      try {
        const res = await serverAxios.get<SiguienteSecuenciaResponse>(
          '/facturas/siguiente-secuencia',
          { params: { tipo } },
        );
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al consultar siguiente secuencia de documento');
      }
    },

    create: async (data: CreateFacturaDto): Promise<Factura> => {
      try {
        const res = await serverAxios.post<Factura>('/facturas', data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al crear documento');
      }
    },

    update: async (id: string, data: UpdateFacturaDto): Promise<Factura> => {
      try {
        const res = await serverAxios.patch<Factura>(`/facturas/${id}`, data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al actualizar documento ${id}`);
      }
    },

    convertirAFactura: async (
      id: string,
      data: ConvertirFacturaDto,
    ): Promise<Factura> => {
      try {
        const res = await serverAxios.post<Factura>(
          `/facturas/${id}/convertir-a-factura`,
          data,
        );
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al convertir cotización ${id} a factura`);
      }
    },

    getPendientes: async (clienteId: string): Promise<Factura[]> => {
      try {
        const res = await serverAxios.get<Factura[]>(
          `/facturas/pendientes/cliente/${clienteId}`,
        );
        return res.data;
      } catch (err) {
        handleAxiosError(
          err,
          `Error al obtener facturas pendientes del cliente ${clienteId}`,
        );
      }
    },

    anular: async (id: string, data?: AnularDocumentoDto): Promise<Factura> => {
      try {
        const res = await serverAxios.patch<Factura>(
          `/facturas/${id}/anular`,
          data || {},
        );
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al anular documento ${id}`);
      }
    },

    sincronizarECF: async (id: string): Promise<any> => {
      try {
        const res = await serverAxios.post(`/facturas/${id}/sincronizar-ecf`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al sincronizar factura ${id} con MSeller ECF`);
      }
    },

    getEstadoECF: async (id: string): Promise<any> => {
      try {
        const res = await serverAxios.get(`/facturas/${id}/estado-ecf`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al consultar estado e-CF para factura ${id}`);
      }
    },

    delete: async (id: string): Promise<any> => {
      try {
        const res = await serverAxios.delete(`/facturas/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al eliminar documento ${id}`);
      }
    },
  },

  // ==========================================
  // Cobros
  // ==========================================
  cobros: {
    findAll: async (params?: GetCobrosParams): Promise<PaginatedResponse<Cobro>> => {
      try {
        const res = await serverAxios.get<PaginatedResponse<Cobro>>('/cobros', {
          params,
        });
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al obtener listado de cobros');
      }
    },

    findOne: async (id: string): Promise<Cobro> => {
      try {
        const res = await serverAxios.get<Cobro>(`/cobros/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al consultar cobro ${id}`);
      }
    },

    getSiguienteRecibo: async (): Promise<SiguienteSecuenciaResponse> => {
      try {
        const res = await serverAxios.get<SiguienteSecuenciaResponse>(
          '/cobros/siguiente-recibo',
        );
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al consultar siguiente recibo de cobro');
      }
    },

    create: async (data: CreateCobroDto): Promise<Cobro> => {
      try {
        const res = await serverAxios.post<Cobro>('/cobros', data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al registrar cobro');
      }
    },

    anular: async (id: string, data?: AnularDocumentoDto): Promise<Cobro> => {
      try {
        const res = await serverAxios.patch<Cobro>(`/cobros/${id}/anular`, data || {});
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al anular cobro ${id}`);
      }
    },
  },

  // ==========================================
  // Equipos
  // ==========================================
  equipos: {
    findAll: async (params?: GetEquiposParams): Promise<PaginatedResponse<Equipo>> => {
      try {
        const res = await serverAxios.get<PaginatedResponse<Equipo>>('/equipos', {
          params,
        });
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al obtener catálogo de equipos');
      }
    },

    findOne: async (id: string): Promise<Equipo> => {
      try {
        const res = await serverAxios.get<Equipo>(`/equipos/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al consultar equipo ${id}`);
      }
    },

    create: async (data: CreateEquipoDto): Promise<Equipo> => {
      try {
        const res = await serverAxios.post<Equipo>('/equipos', data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al registrar equipo');
      }
    },

    update: async (id: string, data: UpdateEquipoDto): Promise<Equipo> => {
      try {
        const res = await serverAxios.patch<Equipo>(`/equipos/${id}`, data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al actualizar equipo ${id}`);
      }
    },

    remove: async (id: string): Promise<Equipo> => {
      try {
        const res = await serverAxios.delete<Equipo>(`/equipos/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al desactivar equipo ${id}`);
      }
    },

    asignar: async (id: string, data: AsignarEquipoDto): Promise<Equipo> => {
      try {
        const res = await serverAxios.post<Equipo>(`/equipos/${id}/asignar`, data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al asignar equipo ${id}`);
      }
    },

    desasignar: async (id: string): Promise<Equipo> => {
      try {
        const res = await serverAxios.post<Equipo>(`/equipos/${id}/desasignar`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al desasignar equipo ${id}`);
      }
    },
  },

  // ==========================================
  // Dashboard & KPIs
  // ==========================================
  dashboard: {
    getKpis: async (): Promise<DashboardKpis> => {
      try {
        const res = await serverAxios.get<DashboardKpis>('/dashboard/kpis');
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al obtener métricas del dashboard');
      }
    },
  },

  // ==========================================
  // Servicios Frecuentes
  // ==========================================
  servicios: {
    findAll: async (params?: GetServiciosParams): Promise<PaginatedResponse<Servicio>> => {
      try {
        const res = await serverAxios.get<PaginatedResponse<Servicio>>('/servicios', {
          params,
        });
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al consultar catálogo de servicios');
      }
    },

    findOne: async (id: string): Promise<Servicio> => {
      try {
        const res = await serverAxios.get<Servicio>(`/servicios/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al consultar servicio ${id}`);
      }
    },

    create: async (data: CreateServicioDto): Promise<Servicio> => {
      try {
        const res = await serverAxios.post<Servicio>('/servicios', data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al registrar servicio');
      }
    },
  },

  // ==========================================
  // Configuración de Empresa
  // ==========================================
  configuracion: {
    getDatosEmpresa: async (): Promise<DatosEmpresa> => {
      try {
        const res = await serverAxios.get<DatosEmpresa>('/configuracion/empresa');
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al consultar datos oficiales de la empresa');
      }
    },
  },

  // ==========================================
  // Secuencias NCF y Lotes e-CF
  // ==========================================
  secuenciasNcf: {
    getAll: async (params?: { estado?: string; serie?: string; search?: string }): Promise<SecuenciaNcf[]> => {
      try {
        const res = await serverAxios.get<SecuenciaNcf[]>('/secuencias-ncf', { params });
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al consultar lotes de secuencias NCF');
      }
    },

    getKpis: async (): Promise<SecuenciasNcfKpis> => {
      try {
        const res = await serverAxios.get<SecuenciasNcfKpis>('/secuencias-ncf/kpis');
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al consultar métricas de secuencias NCF');
      }
    },

    getProximo: async (tipo: string): Promise<ProximoComprobanteVista> => {
      try {
        const res = await serverAxios.get<ProximoComprobanteVista>('/secuencias-ncf/proximo', {
          params: { tipo },
        });
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al consultar próximo NCF para ${tipo}`);
      }
    },

    create: async (data: CreateSecuenciaNcfInput): Promise<SecuenciaNcf> => {
      try {
        const res = await serverAxios.post<SecuenciaNcf>('/secuencias-ncf', data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, 'Error al registrar lote de comprobantes NCF');
      }
    },

    update: async (id: string, data: UpdateSecuenciaNcfInput): Promise<SecuenciaNcf> => {
      try {
        const res = await serverAxios.patch<SecuenciaNcf>(`/secuencias-ncf/${id}`, data);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al actualizar lote ${id}`);
      }
    },

    cambiarEstado: async (id: string, estado: 'ACTIVO' | 'PENDIENTE'): Promise<SecuenciaNcf> => {
      try {
        const res = await serverAxios.patch<SecuenciaNcf>(`/secuencias-ncf/${id}/estado`, { estado });
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al cambiar estado del lote ${id}`);
      }
    },

    delete: async (id: string): Promise<{ success: boolean; mensaje: string }> => {
      try {
        const res = await serverAxios.delete<{ success: boolean; mensaje: string }>(`/secuencias-ncf/${id}`);
        return res.data;
      } catch (err) {
        handleAxiosError(err, `Error al eliminar lote ${id}`);
      }
    },
  },
};
