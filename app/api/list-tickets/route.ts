import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.type !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Nao autorizado' }, { status: 401 }) };
  }
  return { ok: true };
}

export async function GET() {
  const auth = await ensureAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    success: false,
    message: 'Endpoint desativado (Supabase nao utilizado).'
  }, { status: 410 });
}

export async function POST() {
  const auth = await ensureAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    success: false,
    message: 'Endpoint desativado (Supabase nao utilizado).'
  }, { status: 410 });
}
