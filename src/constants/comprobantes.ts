/**
 * Catálogo Oficial de Comprobantes Fiscales Electrónicos (e-CF) según la DGII (República Dominicana).
 * Únicamente habilitados: E31, E32, E34, E45.
 */

export interface ComprobanteOption {
  value: string;
  label: string;
  codigo: string;
  prefijo: string;
  requiereRnc: boolean;
  tipo: 'e-CF';
}

export const COMPROBANTES_ECF: ComprobanteOption[] = [
  {
    value: 'E31',
    label: 'E31 - Factura de Crédito Fiscal Electrónica (31)',
    codigo: '31',
    prefijo: 'E31',
    requiereRnc: true,
    tipo: 'e-CF',
  },
  {
    value: 'E32',
    label: 'E32 - Factura de Consumo Electrónica (32)',
    codigo: '32',
    prefijo: 'E32',
    requiereRnc: false,
    tipo: 'e-CF',
  },
  {
    value: 'E34',
    label: 'E34 - Nota de Crédito Electrónica (34)',
    codigo: '34',
    prefijo: 'E34',
    requiereRnc: false,
    tipo: 'e-CF',
  },
  {
    value: 'E45',
    label: 'E45 - Comprobante Electrónico Gubernamental (45)',
    codigo: '45',
    prefijo: 'E45',
    requiereRnc: true,
    tipo: 'e-CF',
  },
];

export const COMPROBANTES_SERIE_B: ComprobanteOption[] = [];
export const COMPROBANTES_TRADICIONALES = COMPROBANTES_SERIE_B;

/** Lista completa para Select de Ant Design */
export const COMPROBANTES_SELECT_OPTIONS = [
  {
    label: 'Comprobantes Fiscales Electrónicos (e-CF DGII)',
    options: COMPROBANTES_ECF.map((item) => ({
      value: item.value,
      label: item.label,
    })),
  },
];

/** Lista plana */
export const COMPROBANTES_FLAT_OPTIONS = COMPROBANTES_ECF.map((item) => ({
  value: item.value,
  label: item.label,
}));

export function getComprobanteLabel(val?: string | null): string {
  if (!val) return 'Sin comprobante';
  const v = val.trim().toUpperCase();
  const match = COMPROBANTES_ECF.find(
    (c) => c.value.toUpperCase() === v || c.codigo === v || c.prefijo.toUpperCase() === v,
  );
  return match ? match.label : val;
}

/** Formato oficial e-CF: E + 2 dígitos código (31, 32, 34, 45) + 10 dígitos correlativos (13 caracteres) */
export const REGEX_ECF = /^E(31|32|34|45)(\d{10})$/;

export function validarNumeroComprobante(numero?: string): {
  valido: boolean;
  esEcf: boolean;
  prefijo?: string;
  error?: string;
} {
  if (!numero?.trim()) {
    return { valido: true, esEcf: false };
  }

  const limpio = numero.trim().toUpperCase();

  if (limpio.startsWith('B')) {
    return {
      valido: false,
      esEcf: false,
      error: `Los comprobantes Serie B están deshabilitados. Únicamente se permiten comprobantes electrónicos (e-CF): E31, E32, E34 y E45.`,
    };
  }

  const matchEcf = limpio.match(REGEX_ECF);
  if (matchEcf) {
    return { valido: true, esEcf: true, prefijo: `E${matchEcf[1]}` };
  }

  return {
    valido: false,
    esEcf: false,
    error: `Formato de comprobante inválido: '${numero}'. Debe ser un e-CF de 13 caracteres autorizado (E31, E32, E34 o E45, ej. E310000000001).`,
  };
}

/**
 * Retorna el nombre amigable y oficial del comprobante según su tipo fiscal.
 */
export function getNombreComprobanteDoc(tipo?: string | null, ncf?: string | null): string {
  const t = (tipo || '').toUpperCase().trim();
  const num = (ncf || '').toUpperCase().trim();

  if (t === 'E34' || num.startsWith('E34') || t === 'B04' || num.startsWith('B04')) {
    return 'Nota de Crédito Electrónica';
  }
  if (t === 'E31' || num.startsWith('E31')) {
    return 'Factura de Crédito Fiscal Electrónica';
  }
  if (t === 'E32' || num.startsWith('E32')) {
    return 'Factura de Consumo Electrónica';
  }
  if (t === 'E45' || num.startsWith('E45')) {
    return 'Comprobante Electrónico Gubernamental';
  }
  if (t === 'E44' || num.startsWith('E44')) {
    return 'Comprobante para Regímenes Especiales';
  }
  if (t === 'E46' || num.startsWith('E46')) {
    return 'Factura de Exportación Electrónica';
  }
  if (t === 'B01' || num.startsWith('B01')) {
    return 'Factura de Crédito Fiscal';
  }
  if (t === 'B02' || num.startsWith('B02')) {
    return 'Factura de Consumo';
  }
  return 'Factura Fiscal';
}

/**
 * Retorna el título en mayúsculas para el membrete del comprobante impreso.
 */
export function getTituloComprobanteDoc(tipo?: string | null, ncf?: string | null): string {
  const t = (tipo || '').toUpperCase().trim();
  const num = (ncf || '').toUpperCase().trim();

  if (t === 'E34' || num.startsWith('E34') || t === 'B04' || num.startsWith('B04')) {
    return 'NOTA DE CRÉDITO ELECTRÓNICA';
  }
  if (t === 'E31' || num.startsWith('E31')) {
    return 'FACTURA DE CRÉDITO FISCAL ELECTRÓNICA';
  }
  if (t === 'E32' || num.startsWith('E32')) {
    return 'FACTURA DE CONSUMO ELECTRÓNICA';
  }
  if (t === 'E45' || num.startsWith('E45')) {
    return 'COMPROBANTE GUBERNAMENTAL ELECTRÓNICO';
  }
  if (t === 'E44' || num.startsWith('E44')) {
    return 'COMPROBANTE REGÍMENES ESPECIALES';
  }
  if (t === 'E46' || num.startsWith('E46')) {
    return 'FACTURA DE EXPORTACIÓN ELECTRÓNICA';
  }
  return 'FACTURA FISCAL';
}

/**
 * Retorna la etiqueta para el número del documento (ej. N.º NOTA DE CRÉDITO / N.º FACTURA).
 */
export function getEtiquetaNumeroDoc(tipo?: string | null, ncf?: string | null): string {
  const t = (tipo || '').toUpperCase().trim();
  const num = (ncf || '').toUpperCase().trim();

  if (t === 'E34' || num.startsWith('E34') || t === 'B04' || num.startsWith('B04')) {
    return 'N.º NOTA DE CRÉDITO:';
  }
  return 'N.º FACTURA:';
}

