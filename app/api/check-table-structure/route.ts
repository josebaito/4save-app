import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🔍 Verificando estrutura da tabela tecnico_locations...');
    
    // Buscar um usuário real para teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum usuário encontrado para teste'
      }, { status: 404 });
    }
    
    const testUserId = users[0].id;
    console.log('👤 Usando usuário de teste:', testUserId);
    
    // Limpar qualquer localização existente para este usuário
    await supabase
      .from('tecnico_locations')
      .delete()
      .eq('tecnico_id', testUserId);
    
    // Teste 1: Tentar inserir sem accuracy
    console.log('🧪 Teste 1: Inserção sem accuracy...');
    const { data: test1Data, error: test1Error } = await supabase
      .from('tecnico_locations')
      .insert({
        tecnico_id: testUserId,
        latitude: 38.7223,
        longitude: -9.1393,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (test1Error) {
      console.log('❌ Teste 1 falhou:', test1Error.message);
    } else {
      console.log('✅ Teste 1 passou');
      // Limpar
      await supabase
        .from('tecnico_locations')
        .delete()
        .eq('tecnico_id', testUserId);
    }
    
    // Teste 2: Tentar inserir com accuracy
    console.log('🧪 Teste 2: Inserção com accuracy...');
    const { data: test2Data, error: test2Error } = await supabase
      .from('tecnico_locations')
      .insert({
        tecnico_id: testUserId,
        latitude: 38.7223,
        longitude: -9.1393,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (test2Error) {
      console.log('❌ Teste 2 falhou:', test2Error.message);
    } else {
      console.log('✅ Teste 2 passou');
      // Limpar
      await supabase
        .from('tecnico_locations')
        .delete()
        .eq('tecnico_id', testUserId);
    }
    
    // Verificar estrutura atual
    const { data: sampleData, error: sampleError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .limit(1);
    
    let tableStructure: any = 'Desconhecida';
    if (sampleData && sampleData.length > 0) {
      const sample = sampleData[0];
      tableStructure = {
        hasAccuracy: 'accuracy' in sample,
        columns: Object.keys(sample)
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verificação de estrutura concluída',
      tests: {
        test1: {
          success: !test1Error,
          error: test1Error?.message || null
        },
        test2: {
          success: !test2Error,
          error: test2Error?.message || null
        }
      },
      tableStructure: tableStructure,
      sampleError: sampleError?.message || null
    });
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro na verificação de estrutura',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
