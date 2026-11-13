export type EstadoFactura =
  | 'COTIZACION'
  | 'BORRADOR'
  | 'EMITIDA'
  | 'PAGADA_PARCIAL'
  | 'PAGADA'
  | 'ANULADA';

export type MetodoPago =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'TARJETA'
  | 'CHEQUE'
  | 'OTRO';

export type EstadoCobro = 'PROCESADO' | 'PENDIENTE_CONFIRMACION' | 'ANULADO';

export type EstadoEquipo =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_MANTENIMIENTO'
  | 'RETIRADO';

export type PaginatedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginatedMeta;
};

// -------------------------------------------------------------
// Clientes
// -------------------------------------------------------------
export type Cliente = {
  id: string;
  codigo_cliente: string;
  nombre_razon_social: string;
  persona_contacto?: string | null;
  documento_identidad?: string | null;
  tipo_comprobante_defecto?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  limite_credito: number;
  activo: boolean;
  creado_por?: string | null;
  creado_en?: string;
  actualizado_en?: string;
};

export type CreateClienteDto = {
  codigo_cliente: string;
  nombre_razon_social: string;
  persona_contacto?: string | null;
  documento_identidad?: string | null;
  tipo_comprobante_defecto?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  limite_credito?: number;
  activo?: boolean;
  creado_por?: string | null;
};

export type UpdateClienteDto = Partial<CreateClienteDto>;

export type GetClientesParams = {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean;
};

export type ConsultaRncResponse = {
  encontrado: boolean;
  rnc?: string;
  razon_social?: string;
  actividad_economica?: string;
  estado?: string;
  regimen_pago?: string;
  tipo_comprobante_sugerido?: string;
  fuente?: string;
  mensaje?: string;
  limiteAlcanzado?: boolean;
};

export type FacturaPendiente = {
  id: string;
  numero_factura: string | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  saldo_pendiente: number;
  estado: EstadoFactura;
};

export type EstadoCuentaResumen = {
  cliente: {
    id: string;
    codigo_cliente: string;
    nombre_razon_social: string;
    limite_credito: number;
  };
  resumen: {
    saldo_total_pendiente: number;
    total_historico_cobrado: number;
    cantidad_facturas_pendientes: number;
    credito_disponible: number;
  };
  facturas_pendientes: FacturaPendiente[];
  historico_cobros: Array<{
    id: string;
    recibo_numero: string;
    fecha_cobro: string;
    monto_total: number;
    metodo: MetodoPago;
    referencia_transaccion?: string | null;
    estado: EstadoCobro;
  }>;
};

// -------------------------------------------------------------
// Equipos
// -------------------------------------------------------------
export type Equipo = {
  id: string;
  codigo_interno: string;
  numero_serie?: string | null;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  descripcion?: string | null;
  estado: EstadoEquipo;
  tarifa_base: number;
  activo: boolean;
  creado_por?: string | null;
  creado_en?: string;
  actualizado_en?: string;
};

export type CreateEquipoDto = {
  codigo_interno: string;
  numero_serie?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  descripcion?: string;
  estado?: EstadoEquipo;
  tarifa_base?: number;
  activo?: boolean;
  creado_por?: string;
};

export type UpdateEquipoDto = Partial<CreateEquipoDto>;

export type AsignarEquipoDto = {
  cliente_id: string;
  fecha_inicio?: string;
  observaciones?: string;
};

export type GetEquiposParams = {
  page?: number;
  limit?: number;
  search?: string;
  estado?: EstadoEquipo;
  cliente_id?: string;
  activo?: boolean;
};

// -------------------------------------------------------------
// Facturas & Cotizaciones
// -------------------------------------------------------------
export type FacturaDetalle = {
  id?: string;
  factura_id?: string;
  orden: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  impuesto_linea?: number;
  subtotal_linea?: number;
  equipo_id?: string | null;
  servicio_id?: string | null;
};

export type CreateFacturaDetalleDto = {
  orden?: number;
  equipo_id?: string;
  servicio_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  impuesto_linea?: number;
};

export type Factura = {
  id: string;
  numero_factura?: string | null;
  numero_comprobante?: string | null;
  tipo_comprobante?: string | null;
  cliente_id: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  impuestos: number;
  descuentos?: number;
  total: number;
  saldo_pendiente: number;
  estado: EstadoFactura;
  notas?: string | null;
  numero_cotizacion?: string | null;
  titulo_servicio?: string | null;
  aplica_itbis: boolean;
  codigo_seguridad_dgii?: string | null;
  qr_url_dgii?: string | null;
  track_id_dgii?: string | null;
  estado_dgii?: string | null;
  fecha_firma_dgii?: string | null;
  ambiente_ecf?: string | null;
  creado_en?: string;
  actualizado_en?: string;
  clientes?: Cliente;
  factura_detalles?: FacturaDetalle[];
  cobro_facturas?: Array<{
    id?: string;
    cobro_id?: string;
    factura_id: string;
    monto_aplicado: number;
    aplicado_en?: string;
  }>;
};

export type CreateFacturaDto = {
  estado?: EstadoFactura;
  numero_cotizacion?: string;
  titulo_servicio?: string;
  aplica_itbis?: boolean;
  numero_factura?: string;
  numero_comprobante?: string;
  tipo_comprobante?: string;
  cliente_id: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  descuentos?: number;
  notas?: string;
  creado_por?: string;
  detalles: CreateFacturaDetalleDto[];
};

export type UpdateFacturaDto = {
  cliente_id?: string;
  numero_cotizacion?: string;
  titulo_servicio?: string;
  aplica_itbis?: boolean;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  descuentos?: number;
  notas?: string;
  detalles?: CreateFacturaDetalleDto[];
};

export type ConvertirFacturaDto = {
  numero_factura: string;
  tipo_comprobante: string;
  numero_comprobante?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  aplica_itbis?: boolean;
};

export type AnularDocumentoDto = {
  motivo_anulacion?: string;
};

export type GetFacturasParams = {
  page?: number;
  limit?: number;
  search?: string;
  cliente_id?: string;
  estado?: EstadoFactura;
  fecha_desde?: string;
  fecha_hasta?: string;
  solo_pendientes?: boolean;
};

export type SiguienteSecuenciaResponse = {
  siguiente: string;
};

// -------------------------------------------------------------
// Cobros
// -------------------------------------------------------------
export type AplicarFacturaDto = {
  factura_id: string;
  monto_aplicado: number;
};

export type CreateCobroDto = {
  recibo_numero?: string;
  cliente_id: string;
  fecha_cobro?: string;
  monto_total: number;
  metodo: MetodoPago;
  referencia_transaccion?: string;
  estado?: EstadoCobro;
  notas?: string;
  creado_por?: string;
  aplicaciones?: AplicarFacturaDto[];
};

export type Cobro = {
  id: string;
  recibo_numero: string;
  cliente_id: string;
  fecha_cobro: string;
  monto_total: number;
  metodo: MetodoPago;
  referencia_transaccion?: string | null;
  estado: EstadoCobro;
  notas?: string | null;
  creado_por?: string | null;
  creado_en?: string;
  actualizado_en?: string;
  clientes?: Cliente;
  cobro_facturas?: Array<{
    id: string;
    factura_id: string;
    monto_aplicado: number;
    facturas?: Factura;
  }>;
};

export type GetCobrosParams = {
  page?: number;
  limit?: number;
  search?: string;
  cliente_id?: string;
  factura_id?: string;
  metodo?: MetodoPago;
  estado?: EstadoCobro;
  fecha_desde?: string;
  fecha_hasta?: string;
};

// -------------------------------------------------------------
// Dashboard & KPIs
// -------------------------------------------------------------
export type DashboardKpis = {
  total_pendiente_cobro: number;
  total_cobrado_historico: number;
  cantidad_cotizaciones_activas: number;
  cantidad_facturas_por_cobrar: number;
  cantidad_facturas_vencidas: number;
  total_clientes_activos: number;
};

// -------------------------------------------------------------
// Servicios Frecuentes
// -------------------------------------------------------------
export type Servicio = {
  id: string;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
};

export type CreateServicioDto = {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo?: boolean;
};

export type GetServiciosParams = {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean;
};

// -------------------------------------------------------------
// Configuración de Empresa
// -------------------------------------------------------------
export type DatosEmpresa = {
  nombre_empresa: string;
  nombre_corto: string;
  eslogan: string;
  rnc: string;
  direccion: string;
  telefonos: string[];
  correo: string;
  web: string;
  moneda: string;
  itbis_porcentaje: number;
  imprevistos_porcentaje_defecto: number;
};

// Compatibility aliases
export type CreateClienteInput = CreateClienteDto;
export type CreateFacturaInput = CreateFacturaDto;
export type ConvertirFacturaInput = ConvertirFacturaDto;
export type CreateCobroInput = CreateCobroDto;
export type PaginatedResult<T> = PaginatedResponse<T>;

// -------------------------------------------------------------
// Secuencias NCF y Lotes e-CF
// -------------------------------------------------------------
export type EstadoSecuenciaNcf = 'ACTIVO' | 'PENDIENTE' | 'AGOTADO' | 'VENCIDO';

export type SecuenciaNcf = {
  id: string;
  tipo_comprobante: string;
  codigo_dgii: string;
  serie: string;
  nombre: string;
  secuencia_desde: number;
  secuencia_hasta: number;
  secuencia_actual: number;
  consumidos: number;
  restantes: number;
  porcentaje_consumido: number;
  fecha_vencimiento: string;
  alerta_minimo: number;
  estado: EstadoSecuenciaNcf;
  notas?: string | null;
  ultimo_ncf?: string | null;
  proximo_ncf: string;
  en_alerta: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type SecuenciasNcfKpis = {
  total_lotes: number;
  lotes_activos: number;
  lotes_pendientes: number;
  alerta_por_agotar: number;
};

export type CreateSecuenciaNcfInput = {
  tipo_comprobante: string;
  secuencia_desde?: number;
  secuencia_hasta: number;
  secuencia_actual?: number;
  fecha_vencimiento: string;
  alerta_minimo?: number;
  estado?: 'ACTIVO' | 'PENDIENTE';
  notas?: string;
};

export type UpdateSecuenciaNcfInput = Partial<CreateSecuenciaNcfInput> & {
  estado?: EstadoSecuenciaNcf;
};

export type ProximoComprobanteVista = {
  tipo: string;
  prefijo: string;
  nombre: string;
  siguiente: string;
  restantes: number;
  loteId?: string;
  estadoLote?: string;
  fechaVencimiento?: string;
};

