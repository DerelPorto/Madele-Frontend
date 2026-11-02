import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let body = {};
    try {
      body = await request.json();
    } catch {}
    const result = await mainService.facturas.anular(id, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
