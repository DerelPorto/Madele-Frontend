import { NextResponse } from 'next/server';
import { mainService } from '@/services/mainService';
import { handleRouteError } from '@/lib/apiRouteUtils';

export async function GET() {
  try {
    const result = await mainService.dashboard.getKpis();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
