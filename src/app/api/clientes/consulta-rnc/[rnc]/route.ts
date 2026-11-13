import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rnc: string }> },
) {
  try {
    const { rnc } = await params;
    const result = await mainService.clientes.consultarRnc(rnc);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
