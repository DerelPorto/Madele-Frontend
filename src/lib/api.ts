import { clientApi } from '@/services/clientMainService';

export const api = {
  // Clientes
  getClientes: clientApi.getClientes,
  getCliente: clientApi.getCliente,
  getEstadoCuenta: clientApi.getEstadoCuenta,
  createCliente: clientApi.createCliente,
  updateCliente: clientApi.updateCliente,
  deleteCliente: clientApi.deleteCliente,

  // Facturas
  getFacturas: clientApi.getFacturas,
  getFactura: clientApi.getFactura,
  getSiguienteSecuencia: clientApi.getSiguienteSecuencia,
  getPendientesCliente: clientApi.getPendientesCliente,
  getFacturasPendientesCliente: clientApi.getPendientesCliente,
  createFactura: clientApi.createFactura,
  updateFactura: clientApi.updateFactura,
  convertirAFactura: clientApi.convertirAFactura,
  anularFactura: clientApi.anularFactura,

  // Cobros
  getCobros: clientApi.getCobros,
  getCobro: clientApi.getCobro,
  getSiguienteRecibo: clientApi.getSiguienteRecibo,
  createCobro: clientApi.createCobro,
  anularCobro: clientApi.anularCobro,

  // Dashboard & KPIs
  getDashboardKpis: clientApi.getDashboardKpis,

  // Servicios
  getServicios: clientApi.getServicios,
  getServicio: clientApi.getServicio,
  createServicio: clientApi.createServicio,

  // Configuración
  getDatosEmpresa: clientApi.getDatosEmpresa,

  // Equipos
  getEquipos: clientApi.getEquipos,
  getEquipo: clientApi.getEquipo,
  createEquipo: clientApi.createEquipo,
  updateEquipo: clientApi.updateEquipo,
  deleteEquipo: clientApi.deleteEquipo,
  asignarEquipo: clientApi.asignarEquipo,
  desasignarEquipo: clientApi.desasignarEquipo,
};

export { clientApi };
