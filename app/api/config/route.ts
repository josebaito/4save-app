import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { readAppConfig, writeAppConfig } from '@/lib/app-config';

function ensureAdmin(session: any) {
  if (!session?.user || session.user.type !== 'admin') {
    return false;
  }
  return true;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const config = await readAppConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const payload = await request.json();
  const next = await writeAppConfig({
    appName: payload.appName,
    reportLogoUrl: payload.reportLogoUrl,
    pdfTemplate: payload.pdfTemplate,
  });
  return NextResponse.json(next);
}
