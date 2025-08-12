import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🧪 Testando upsert para evitar unique constraint...');
    
    // Buscar um usuário para teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum usuário encontrado para teste'
      }, { status: 404 });
    }
    
    const testUser = users[0];
    console.log('👤 Testando com usuário:', testUser.id);
    
    // Tentar upsert (insert on conflict update)
    const { data: upsertData, error: upsertError } = await supabase
      .from('tecnico_locations')
      .upsert({
        tecnico_id: testUser.id,
        latitude: 38.7223,
        longitude: -9.1393,
        accuracy: 20,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tecnico_id'
      })
      .select()
      .single();
    
    if (upsertError) {
      console.error('❌ Erro no upsert:', upsertError);
      return NextResponse.json({
        success: false,
        error: 'Erro no upsert',
        details: upsertError
      }, { status: 500 });
    }
    
    console.log('✅ Upsert realizado com sucesso:', upsertData);
    
    return NextResponse.json({
      success: true,
      message: 'Upsert testado com sucesso',
      data: upsertData,
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de upsert',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
