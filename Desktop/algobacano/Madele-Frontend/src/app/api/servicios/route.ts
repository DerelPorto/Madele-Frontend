import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const rawLimit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const limit = rawLimit !== undefined ? Math.min(Math.max(rawLimit, 1), 100) : undefined;
    const search = searchParams.get('search') || undefined;
    const activoParam = searchParams.get('activo');
    const activo = activoParam !== null ? activoParam === 'true' : undefined;

    const result = await mainService.servicios.findAll({
      page,
      limit,
      search,
      activo,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await mainService.servicios.create(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
