import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

// Endpoint para testar o sistema de geolocalização
export async function GET() {
  try {
    const supabase = createSupabaseClient();
    console.log('🧪 Testando sistema de geolocalização...');
    
    // Testar tabela tecnico_locations
    const { data: locations, error: errorLocations } = await supabase
      .from('tecnico_locations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    console.log('📍 Teste da tabela tecnico_locations:');
    console.log('  - Erro:', errorLocations);
    console.log('  - Dados encontrados:', locations?.length || 0);
    if (locations && locations.length > 0) {
      console.log('  - Exemplo de localização:', locations[0]);
    }
    
    // Testar tabela users
    const { data: users, error: errorUsers } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    console.log('👥 Teste da tabela users:');
    console.log('  - Erro:', errorUsers);
    console.log('  - Usuários encontrados:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('  - Exemplo de usuário:', users[0]);
    }
    
    // Testar join entre tecnico_locations e users
    const { data: tecnicosComLocations, error: errorJoin } = await supabase
      .from('tecnico_locations')
      .select(`
        *,
        users!tecnico_locations_tecnico_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(5);
    
    console.log('🔗 Teste do join tecnico_locations -> users:');
    console.log('  - Erro:', errorJoin);
    console.log('  - Dados encontrados:', tecnicosComLocations?.length || 0);
    if (tecnicosComLocations && tecnicosComLocations.length > 0) {
      console.log('  - Exemplo de join:', tecnicosComLocations[0]);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Teste de geolocalização concluído',
      results: {
        tecnico_locations: {
          error: errorLocations?.message || null,
          count: locations?.length || 0,
          sample: locations?.[0] || null
        },
        users: {
          error: errorUsers?.message || null,
          count: users?.length || 0,
          sample: users?.[0] || null
        },
        join_test: {
          error: errorJoin?.message || null,
          count: tecnicosComLocations?.length || 0,
          sample: tecnicosComLocations?.[0] || null
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de geolocalização:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint para criar dados de teste de geolocalização
export async function POST() {
  try {
    const supabase = createSupabaseClient();
    console.log('🧪 Criando dados de teste para geolocalização...');
    
    // Buscar um usuário existente
    const { data: users, error: errorUsers } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (errorUsers) {
      console.error('Erro ao buscar usuários:', errorUsers);
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar usuários: ${errorUsers.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum usuário encontrado para criar dados de teste',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const user = users[0];
    console.log('👤 Usuário encontrado para teste:', user);
    
    // Criar localização de teste (Lisboa)
    const { data: locationTeste, error: errorLocation } = await supabase
      .from('tecnico_locations')
      .insert({
        tecnico_id: user.id,
        latitude: 38.7223,
        longitude: -9.1393,
        accuracy: 10,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (errorLocation) {
      console.error('Erro ao criar localização de teste:', errorLocation);
      return NextResponse.json({
        success: false,
        error: `Erro ao criar localização de teste: ${errorLocation.message}`,
        details: errorLocation,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Localização de teste criada com sucesso:', locationTeste);
    
    return NextResponse.json({
      success: true,
      message: 'Dados de teste de geolocalização criados com sucesso',
      data: {
        user: user,
        location: locationTeste
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
