import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const result = await mainService.auth.perfil(token);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
