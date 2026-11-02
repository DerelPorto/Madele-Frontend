import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = (searchParams.get('tipo') as 'COTIZACION' | 'FACTURA') || 'COTIZACION';
    const result = await mainService.facturas.getSiguienteSecuencia(tipo);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
