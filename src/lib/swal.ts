import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';
import { extractErrorMessage } from './utils';

/**
 * Instancia preconfigurada de SweetAlert2 con estilos corporativos MADELES.
 */
export const CustomSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-3xl p-6 shadow-2xl border border-slate-200/90 font-sans',
    title: 'text-lg font-black text-slate-900 tracking-tight',
    htmlContainer: 'text-sm text-slate-600 font-medium leading-relaxed mt-2',
    confirmButton:
      'bg-[#0066B3] hover:bg-[#005494] text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all mx-1 text-sm border-0 cursor-pointer',
    cancelButton:
      'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all mx-1 text-sm border-0 cursor-pointer',
  },
  buttonsStyling: false,
});

/**
 * Muestra una alerta modal interactiva de error al usuario,
 * extrayendo de forma inteligente el mensaje devuelto por la API o el validador fiscal.
 */
export async function showErrorAlert(
  error: any,
  title: string = 'Atención',
): Promise<SweetAlertResult> {
  const message = extractErrorMessage(error);

  return CustomSwal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Entendido',
  });
}

/**
 * Muestra una alerta modal interactiva de advertencia o validación.
 */
export async function showWarningAlert(
  message: string,
  title: string = 'Verifique los Datos',
): Promise<SweetAlertResult> {
  return CustomSwal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'Aceptar',
  });
}

/**
 * Muestra una alerta modal interactiva de éxito.
 */
export async function showSuccessAlert(
  message: string,
  title: string = 'Operación Exitosa',
): Promise<SweetAlertResult> {
  return CustomSwal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'Continuar',
  });
}

/**
 * Muestra un diálogo interactivo de confirmación (ej. Anular documento, eliminar partida).
 */
export async function showConfirmDialog(
  message: string,
  title: string = '¿Está seguro?',
  confirmText: string = 'Sí, continuar',
  cancelText: string = 'Cancelar',
): Promise<boolean> {
  const result = await CustomSwal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });

  return result.isConfirmed;
}

export default CustomSwal;

