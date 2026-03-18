import { NextResponse } from 'next/server';
import { readAppConfig } from '@/lib/app-config';

export async function GET() {
  const config = await readAppConfig();
  return NextResponse.json(config);
}

