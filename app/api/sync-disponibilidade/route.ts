import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db/supabase';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!['admin', 'tecnico'].includes(session.user.type)) {
      return NextResponse.json({ error: 'Perfil não autorizado' }, { status: 403 });
    }

    console.log('🔄 Iniciando sincronização de disponibilidade...');
    
    await db.sincronizarDisponibilidadeTecnicos();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Disponibilidade sincronizada com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao sincronizar disponibilidade:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao sincronizar disponibilidade' },
      { status: 500 }
    );
  }
}
