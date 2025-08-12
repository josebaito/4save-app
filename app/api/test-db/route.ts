// Rota de API para testar a conexão com o banco de dados e a tabela tecnico_locations
import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic'; // Impede o cache da rota

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🔍 Testando estrutura do banco de dados...');
    
    // Testar tabela cronograma_manutencao
    const { data: cronogramas, error: errorCronogramas } = await supabase
      .from('cronograma_manutencao')
      .select('*')
      .limit(5);
    
    console.log('📋 Teste da tabela cronograma_manutencao:');
    console.log('  - Erro:', errorCronogramas);
    console.log('  - Dados encontrados:', cronogramas?.length || 0);
    if (cronogramas && cronogramas.length > 0) {
      console.log('  - Estrutura do primeiro registro:', Object.keys(cronogramas[0]));
      console.log('  - Exemplo de dados:', cronogramas[0]);
    }
    
    // Testar tabela tickets
    const { data: tickets, error: errorTickets } = await supabase
      .from('tickets')
      .select('*')
      .limit(5);
    
    console.log('🎫 Teste da tabela tickets:');
    console.log('  - Erro:', errorTickets);
    console.log('  - Dados encontrados:', tickets?.length || 0);
    if (tickets && tickets.length > 0) {
      console.log('  - Estrutura do primeiro registro:', Object.keys(tickets[0]));
      console.log('  - Exemplo de dados:', tickets[0]);
    }
    
    // Testar tabela contratos
    const { data: contratos, error: errorContratos } = await supabase
      .from('contratos')
      .select('*')
      .limit(5);
    
    console.log('📄 Teste da tabela contratos:');
    console.log('  - Erro:', errorContratos);
    console.log('  - Dados encontrados:', contratos?.length || 0);
    if (contratos && contratos.length > 0) {
      console.log('  - Estrutura do primeiro registro:', Object.keys(contratos[0]));
      console.log('  - Exemplo de dados:', contratos[0]);
    }
    
    // Testar join entre cronogramas e contratos
    const { data: cronogramasComContratos, error: errorJoin } = await supabase
      .from('cronograma_manutencao')
      .select(`
        *,
        contrato:contratos(*)
      `)
      .limit(3);
    
    console.log('🔗 Teste do join cronograma_manutencao -> contratos:');
    console.log('  - Erro:', errorJoin);
    console.log('  - Dados encontrados:', cronogramasComContratos?.length || 0);
    if (cronogramasComContratos && cronogramasComContratos.length > 0) {
      console.log('  - Exemplo de join:', cronogramasComContratos[0]);
    }
    
    // Testar tabela tecnico_locations
    const { data: locations, error: errorLocations } = await supabase
      .from('tecnico_locations')
      .select('*')
      .limit(5);
    
    console.log('📍 Teste da tabela tecnico_locations:');
    console.log('  - Erro:', errorLocations);
    console.log('  - Dados encontrados:', locations?.length || 0);
    if (locations && locations.length > 0) {
      console.log('  - Exemplo de localização:', locations[0]);
    }
    
    // Testar join entre tecnico_locations e users
    const { data: locationsComUsers, error: errorLocationsJoin } = await supabase
      .from('tecnico_locations')
      .select(`
        *,
        users!tecnico_locations_tecnico_id_fkey (
          id,
          name,
          email
        )
      `)
      .limit(3);
    
    console.log('🔗 Teste do join tecnico_locations -> users:');
    console.log('  - Erro:', errorLocationsJoin);
    console.log('  - Dados encontrados:', locationsComUsers?.length || 0);
    if (locationsComUsers && locationsComUsers.length > 0) {
      console.log('  - Exemplo de join:', locationsComUsers[0]);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Teste de estrutura do banco concluído',
      results: {
        cronograma_manutencao: {
          error: errorCronogramas?.message || null,
          count: cronogramas?.length || 0,
          sample: cronogramas?.[0] || null
        },
        tickets: {
          error: errorTickets?.message || null,
          count: tickets?.length || 0,
          sample: tickets?.[0] || null
        },
        contratos: {
          error: errorContratos?.message || null,
          count: contratos?.length || 0,
          sample: contratos?.[0] || null
        },
        join_test: {
          error: errorJoin?.message || null,
          count: cronogramasComContratos?.length || 0,
          sample: cronogramasComContratos?.[0] || null
        },
        tecnico_locations: {
          error: errorLocations?.message || null,
          count: locations?.length || 0,
          sample: locations?.[0] || null
        },
        locations_join: {
          error: errorLocationsJoin?.message || null,
          count: locationsComUsers?.length || 0,
          sample: locationsComUsers?.[0] || null
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de estrutura:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint para criar cronograma de teste
export async function POST() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🧪 Criando cronograma de teste com data vencida...');
    
    // Buscar um contrato existente
    const { data: contratos, error: errorContratos } = await supabase
      .from('contratos')
      .select('*')
      .limit(1);
    
    if (errorContratos || !contratos || contratos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum contrato encontrado para criar cronograma de teste',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const contrato = contratos[0];
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1); // Data de ontem (vencida)
    
    // Criar cronograma de teste com data vencida
    const { data: cronogramaTeste, error: errorCronograma } = await supabase
      .from('cronograma_manutencao')
      .insert({
        contrato_id: contrato.id,
        tipo_manutencao: 'preventiva',
        frequencia: 'mensal',
        proxima_manutencao: ontem.toISOString().split('T')[0], // Data vencida
        status: 'ativo'
      })
      .select()
      .single();
    
    if (errorCronograma) {
      console.error('Erro ao criar cronograma de teste:', errorCronograma);
      return NextResponse.json({
        success: false,
        error: `Erro ao criar cronograma de teste: ${errorCronograma.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Cronograma de teste criado com sucesso:', cronogramaTeste);
    
    return NextResponse.json({
      success: true,
      message: 'Cronograma de teste criado com sucesso',
      cronograma: cronogramaTeste,
      debug_info: {
        data_atual: hoje.toISOString().split('T')[0],
        data_cronograma: ontem.toISOString().split('T')[0],
        esta_vencido: ontem.toISOString().split('T')[0] <= hoje.toISOString().split('T')[0]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar cronograma de teste:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}