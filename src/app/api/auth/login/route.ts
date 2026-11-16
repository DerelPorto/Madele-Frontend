import { NextRequest, NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await mainService.auth.login(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
