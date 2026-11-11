import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { estado } = await req.json();
    const data = await mainService.secuenciasNcf.cambiarEstado(id, estado);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Error al cambiar estado del lote' },
      { status: err?.statusCode || 400 },
    );
  }
}
