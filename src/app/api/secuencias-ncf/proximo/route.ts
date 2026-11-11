import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') || 'E31';
    const data = await mainService.secuenciasNcf.getProximo(tipo);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Error al obtener próximo comprobante' },
      { status: err?.statusCode || 500 },
    );
  }
}
