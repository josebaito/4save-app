import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/supabase';

export async function POST(request: NextRequest) {
  try {
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
