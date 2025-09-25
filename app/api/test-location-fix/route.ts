import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🧪 Testando fix para unique constraint...');
    
    // Verificar se existem usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar usuários',
        details: usersError
      }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum usuário encontrado'
      }, { status: 404 });
    }
    
    const testUser = users[0];
    console.log('👤 Usuário de teste:', testUser.id);
    
    // Verificar localizações existentes
    const { data: existingLocations, error: locationsError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .eq('tecnico_id', testUser.id as string);
    
    if (locationsError) {
      console.log('❌ Erro ao verificar localizações existentes:', locationsError);
    } else {
      console.log('📍 Localizações existentes:', existingLocations?.length || 0);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Teste de verificação concluído',
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email
      },
      existingLocations: existingLocations?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🧪 Testando updateTecnicoLocation com fix...');
    
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
    
    // Importar a função updateTecnicoLocation
    const { db } = await import('@/lib/db/supabase');
    
    // Testar a função updateTecnicoLocation
    const result = await db.updateTecnicoLocation({
      tecnico_id: testUser.id as string,
      latitude: 38.7223,
      longitude: -9.1393,
      accuracy: 15,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Resultado do teste:', result);
    
    // Verificar se foi inserido
    const { data: insertedLocation, error: checkError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .eq('tecnico_id', testUser.id as string)
      .single();
    
    if (checkError) {
      console.log('⚠️ Erro ao verificar inserção:', checkError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Teste de updateTecnicoLocation concluído',
      result: result,
      insertedLocation: insertedLocation,
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
      error: 'Erro no teste de updateTecnicoLocation',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
