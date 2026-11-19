import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function POST(_request: NextRequest) {
  try {
    const result = await mainService.facturas.sincronizarPendientesECF();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
