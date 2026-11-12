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

