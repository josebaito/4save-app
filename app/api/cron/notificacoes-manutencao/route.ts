import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.type !== 'admin') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }
  return NextResponse.json({
    success: false,
    message: 'Endpoint de notificacoes desativado (nao aplicavel ao backend atual).'
  }, { status: 410 });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.type !== 'admin') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }
  return NextResponse.json({
    success: false,
    message: 'Endpoint de notificacoes desativado (nao aplicavel ao backend atual).'
  }, { status: 410 });
}
