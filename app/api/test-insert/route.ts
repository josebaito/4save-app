import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseClient();
    console.log('🧪 Teste simples de inserção...');
    
    // Dados de teste
    const testData = {
      tecnico_id: "1",
      latitude: 38.7223,
      longitude: -9.1393,
      accuracy: 10,
      timestamp: new Date().toISOString()
    };
    
    console.log('📍 Tentando inserir:', testData);
    
    // Tentar inserção simples
    const { data, error } = await supabase
      .from('tecnico_locations')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro na inserção:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        test_data: testData,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Inserção bem-sucedida:', data);
    
    // Limpar o registro de teste
    const { error: deleteError } = await supabase
      .from('tecnico_locations')
      .delete()
      .eq('tecnico_id', '1');
    
    if (deleteError) {
      console.error('⚠️ Erro ao limpar:', deleteError);
    } else {
      console.log('🧹 Registro de teste removido');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Inserção de teste bem-sucedida',
      data: data,
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
