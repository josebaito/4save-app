import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    console.log('🔍 Verificando estrutura da tabela tecnico_locations...');
    
    // Verificar se a tabela existe
    const { data: tableInfo, error: tableError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError);
      return NextResponse.json({
        success: false,
        error: `Erro ao acessar tabela: ${tableError.message}`,
        details: tableError,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Tentar inserir um registro de teste sem foreign key
    const testData = {
      tecnico_id: "test-user-123",
      latitude: 38.7223,
      longitude: -9.1393,
      accuracy: 10,
      timestamp: new Date().toISOString()
    };
    
    console.log('📍 Tentando inserir dados de teste:', testData);
    
    const { data: insertData, error: insertError } = await supabase
      .from('tecnico_locations')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      return NextResponse.json({
        success: false,
        error: `Erro na inserção: ${insertError.message}`,
        details: insertError,
        test_data: testData,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Inserção bem-sucedida:', insertData);
    
    // Limpar o registro de teste
    const { error: deleteError } = await supabase
      .from('tecnico_locations')
      .delete()
      .eq('tecnico_id', 'test-user-123');
    
    if (deleteError) {
      console.error('⚠️ Erro ao limpar dados de teste:', deleteError);
    } else {
      console.log('🧹 Dados de teste removidos');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Estrutura da tabela verificada com sucesso',
      table_exists: true,
      insert_test_passed: true,
      test_data: testData,
      inserted_data: insertData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
