import { NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function POST() {
  try {
    const result = await mainService.configuracion.limpiarDatosPrueba();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
