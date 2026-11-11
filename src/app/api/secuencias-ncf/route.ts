import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') || undefined;
    const serie = searchParams.get('serie') || undefined;
    const search = searchParams.get('search') || undefined;

    const data = await mainService.secuenciasNcf.getAll({ estado, serie, search });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Error al obtener lotes de secuencias NCF' },
      { status: err?.statusCode || 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await mainService.secuenciasNcf.create(body);
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Error al registrar lote de comprobantes' },
      { status: err?.statusCode || 400 },
    );
  }
}
