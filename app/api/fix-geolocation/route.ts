import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseClient();
    console.log('🔧 Corrigindo tabela tecnico_locations...');

    // 1. Verificar se a tabela existe e tentar inserir com accuracy
    console.log('📋 Testando inserção com accuracy...');
    const { data: testLocation, error: testError } = await supabase
      .from('tecnico_locations')
      .insert({
        tecnico_id: 'test-user',
        latitude: 38.7223,
        longitude: -9.1393,
        accuracy: 10,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erro na inserção com accuracy:', testError);
      
      // Se o erro for sobre a coluna accuracy, tentar sem ela
      if (testError.message.includes('accuracy')) {
        console.log('🔄 Tentando inserção sem accuracy...');
        const { data: testLocation2, error: testError2 } = await supabase
          .from('tecnico_locations')
          .insert({
            tecnico_id: 'test-user',
            latitude: 38.7223,
            longitude: -9.1393,
            timestamp: new Date().toISOString()
          })
          .select()
          .single();

        if (testError2) {
          console.error('❌ Erro na inserção sem accuracy:', testError2);
          return NextResponse.json({ 
            success: false, 
            error: 'Falha na inserção de teste',
            details: { with_accuracy: testError, without_accuracy: testError2 }
          }, { status: 500 });
        }

        console.log('✅ Inserção sem accuracy funcionou:', testLocation2);
        
        // Limpar dados de teste
        await supabase
          .from('tecnico_locations')
          .delete()
          .eq('tecnico_id', 'test-user');

        return NextResponse.json({ 
          success: true, 
          message: 'Tabela funciona sem coluna accuracy',
          warning: 'A coluna accuracy não existe na tabela. O sistema funcionará sem ela.',
          test_result: testLocation2
        });
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Falha na inserção de teste',
        details: testError 
      }, { status: 500 });
    }

    // 6. Limpar dados de teste
    console.log('🧹 Limpando dados de teste...');
    await supabase
      .from('tecnico_locations')
      .delete()
      .eq('tecnico_id', 'test-user');

    console.log('✅ Tabela tecnico_locations funciona corretamente!');
    return NextResponse.json({ 
      success: true, 
      message: 'Tabela tecnico_locations funciona corretamente',
      test_result: testLocation
    });

  } catch (error) {
    console.error('❌ Erro ao corrigir tabela:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // Verificar se há dados
    const { data: locations, error: locationsError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .limit(5);

    // Tentar inserir um registro de teste para verificar estrutura
    const { data: testInsert, error: testError } = await supabase
      .from('tecnico_locations')
      .insert({
        tecnico_id: 'structure-test',
        latitude: 38.7223,
        longitude: -9.1393,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    // Limpar o teste
    if (testInsert) {
      await supabase
        .from('tecnico_locations')
        .delete()
        .eq('tecnico_id', 'structure-test');
    }

    return NextResponse.json({
      success: true,
      message: 'Status da tabela tecnico_locations',
      table_status: {
        has_data: locations && locations.length > 0,
        data_count: locations ? locations.length : 0,
        data_error: locationsError,
        structure_test: {
          success: !testError,
          error: testError,
          sample: testInsert
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao verificar tabela',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
