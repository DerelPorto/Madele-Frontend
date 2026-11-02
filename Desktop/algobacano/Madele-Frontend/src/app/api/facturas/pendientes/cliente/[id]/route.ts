import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await mainService.facturas.getPendientes(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
