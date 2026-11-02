import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';
import type { MetodoPago, EstadoCobro } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const rawLimit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const limit = rawLimit !== undefined ? Math.min(Math.max(rawLimit, 1), 100) : undefined;
    const search = searchParams.get('search') || undefined;
    const cliente_id = searchParams.get('cliente_id') || undefined;
    const factura_id = searchParams.get('factura_id') || undefined;
    const metodo = (searchParams.get('metodo') as MetodoPago) || undefined;
    const estado = (searchParams.get('estado') as EstadoCobro) || undefined;
    const fecha_desde = searchParams.get('fecha_desde') || undefined;
    const fecha_hasta = searchParams.get('fecha_hasta') || undefined;

    const result = await mainService.cobros.findAll({
      page,
      limit,
      search,
      cliente_id,
      factura_id,
      metodo,
      estado,
      fecha_desde,
      fecha_hasta,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await mainService.cobros.create(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
