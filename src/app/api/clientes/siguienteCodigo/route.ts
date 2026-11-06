import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function GET(request: NextRequest) {
  try {
    const result = await mainService.clientes.getSiguienteCodigo();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
