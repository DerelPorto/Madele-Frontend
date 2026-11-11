import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const data = await mainService.secuenciasNcf.update(id, body);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Error al actualizar lote' },
      { status: err?.statusCode || 400 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await mainService.secuenciasNcf.delete(id);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Error al eliminar lote' },
      { status: err?.statusCode || 400 },
    );
  }
}
