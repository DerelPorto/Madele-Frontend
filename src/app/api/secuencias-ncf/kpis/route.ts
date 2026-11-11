import { NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';

export async function GET() {
  try {
    const data = await mainService.secuenciasNcf.getKpis();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Error al obtener métricas de secuencias' },
      { status: err?.statusCode || 500 },
    );
  }
}
