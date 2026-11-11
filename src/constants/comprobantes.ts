/**
 * Catálogo Oficial de Comprobantes Fiscales (e-CF y NCF) según la DGII (República Dominicana).
 */

export interface ComprobanteOption {
  value: string;
  label: string;
  codigo: string;
  prefijo: string;
  requiereRnc: boolean;
  tipo: 'e-CF' | 'NCF';
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
    value: 'E33',
    label: 'E33 - Nota de Débito Electrónica (33)',
    codigo: '33',
    prefijo: 'E33',
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
    value: 'E41',
    label: 'E41 - Comprobante Electrónico de Compras (41)',
    codigo: '41',
    prefijo: 'E41',
    requiereRnc: false,
    tipo: 'e-CF',
  },
  {
    value: 'E43',
    label: 'E43 - Comprobante Electrónico para Gastos Menores (43)',
    codigo: '43',
    prefijo: 'E43',
    requiereRnc: false,
    tipo: 'e-CF',
  },
  {
    value: 'E44',
    label: 'E44 - Comprobante Electrónico para Regímenes Especiales (44)',
    codigo: '44',
    prefijo: 'E44',
    requiereRnc: true,
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
  {
    value: 'E46',
    label: 'E46 - Comprobante Electrónico de Exportaciones (46)',
    codigo: '46',
    prefijo: 'E46',
    requiereRnc: false,
    tipo: 'e-CF',
  },
  {
    value: 'E47',
    label: 'E47 - Comprobante Electrónico para Pagos al Exterior (47)',
    codigo: '47',
    prefijo: 'E47',
    requiereRnc: false,
    tipo: 'e-CF',
  },
];

export const COMPROBANTES_TRADICIONALES: ComprobanteOption[] = [
  {
    value: 'B01',
    label: 'B01 - Crédito Fiscal (Tradicional)',
    codigo: '01',
    prefijo: 'B01',
    requiereRnc: true,
    tipo: 'NCF',
  },
  {
    value: 'B02',
    label: 'B02 - Consumidor Final (Tradicional)',
    codigo: '02',
    prefijo: 'B02',
    requiereRnc: false,
    tipo: 'NCF',
  },
  {
    value: 'B14',
    label: 'B14 - Régimen Especial (Tradicional)',
    codigo: '14',
    prefijo: 'B14',
    requiereRnc: true,
    tipo: 'NCF',
  },
  {
    value: 'B15',
    label: 'B15 - Gubernamental (Tradicional)',
    codigo: '15',
    prefijo: 'B15',
    requiereRnc: true,
    tipo: 'NCF',
  },
];

/** Lista completa para Select de Ant Design */
export const COMPROBANTES_SELECT_OPTIONS = [
  {
    label: 'Comprobantes Electrónicos (e-CF DGII)',
    options: COMPROBANTES_ECF.map((item) => ({
      value: item.value,
      label: item.label,
    })),
  },
  {
    label: 'Comprobantes Tradicionales (NCF)',
    options: COMPROBANTES_TRADICIONALES.map((item) => ({
      value: item.value,
      label: item.label,
    })),
  },
];

/** Lista plana */
export const COMPROBANTES_FLAT_OPTIONS = [
  ...COMPROBANTES_ECF.map((item) => ({ value: item.value, label: item.label })),
  ...COMPROBANTES_TRADICIONALES.map((item) => ({ value: item.value, label: item.label })),
];

export function getComprobanteLabel(val?: string | null): string {
  if (!val) return 'Sin comprobante';
  const v = val.trim().toUpperCase();
  const match = [...COMPROBANTES_ECF, ...COMPROBANTES_TRADICIONALES].find(
    (c) => c.value.toUpperCase() === v || c.codigo === v || c.prefijo.toUpperCase() === v,
  );
  return match ? match.label : val;
}

/** Formato oficial e-CF: E + 2 dígitos código + 10 dígitos correlativos (13 caracteres) */
export const REGEX_ECF = /^E(31|32|33|34|41|43|44|45|46|47)(\d{10})$/;

/** Formato oficial NCF tradicional: B + 2 dígitos tipo + 8 dígitos correlativos (11 caracteres) */
export const REGEX_NCF_TRADICIONAL = /^B(01|02|03|04|11|12|13|14|15|16|17)(\d{8})$/;

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

  const matchEcf = limpio.match(REGEX_ECF);
  if (matchEcf) {
    return { valido: true, esEcf: true, prefijo: `E${matchEcf[1]}` };
  }

  const matchNcf = limpio.match(REGEX_NCF_TRADICIONAL);
  if (matchNcf) {
    return { valido: true, esEcf: false, prefijo: `B${matchNcf[1]}` };
  }

  return {
    valido: false,
    esEcf: false,
    error: `Formato de comprobante inválido: '${numero}'. Debe ser un e-CF de 13 caracteres (ej. E310000000001) o un NCF de 11 caracteres (ej. B0100000001).`,
  };
}

