import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🧪 Verificando estado da tabela tecnico_locations...');
    
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
      .eq('tecnico_id', testUser.id);
    
    if (locationsError) {
      console.log('❌ Erro ao verificar localizações existentes:', locationsError);
    } else {
      console.log('📍 Localizações existentes:', existingLocations?.length || 0);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verificação concluída',
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email
      },
      existingLocations: existingLocations?.length || 0,
      locations: existingLocations || []
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
    
    console.log('🧪 Testando inserção simples sem accuracy...');
    
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
    
    // Usar upsert para evitar problemas de unique constraint
    const { data: locationData, error: locationError } = await supabase
      .from('tecnico_locations')
      .upsert({
        tecnico_id: testUser.id,
        latitude: 38.7223,
        longitude: -9.1393,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tecnico_id'
      })
      .select()
      .single();
    
    if (locationError) {
      console.error('❌ Erro na inserção:', locationError);
      return NextResponse.json({
        success: false,
        error: 'Erro na inserção',
        details: locationError
      }, { status: 500 });
    }
    
    console.log('✅ Localização inserida com sucesso:', locationData);
    
    // Limpar após o teste
    setTimeout(async () => {
      try {
        await supabase
          .from('tecnico_locations')
          .delete()
          .eq('tecnico_id', testUser.id);
        console.log('🧹 Localização de teste removida');
      } catch (cleanupError) {
        console.error('❌ Erro na limpeza:', cleanupError);
      }
    }, 5000);
    
    return NextResponse.json({
      success: true,
      message: 'Teste de inserção concluído',
      location: locationData,
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
      error: 'Erro no teste de inserção',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
