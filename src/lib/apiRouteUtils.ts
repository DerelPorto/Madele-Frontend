import { NextResponse } from 'next/server';
import { ServiceError } from '@/services/mainService';

export function handleRouteError(error: unknown) {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      {
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  const err = error as Error;
  return NextResponse.json(
    {
      message: err?.message || 'Error interno del servidor',
    },
    { status: 500 },
  );
}
