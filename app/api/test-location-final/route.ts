import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseClient();
    console.log('🧪 Teste final de localização...');
    
    // Verificar se o usuário admin existe
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', '1')
      .single();
    
    if (userError || !adminUser) {
      console.error('❌ Usuário admin não encontrado:', userError);
      return NextResponse.json({
        success: false,
        error: 'Usuário admin não encontrado',
        details: userError,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser);
    
    // Dados de teste
    const testLocation = {
      tecnico_id: "1",
      latitude: 38.7223,
      longitude: -9.1393,
      accuracy: 10,
      timestamp: new Date().toISOString()
    };
    
    console.log('📍 Tentando inserir localização:', testLocation);
    
    // Remover localização anterior se existir
    const { error: deleteError } = await supabase
      .from('tecnico_locations')
      .delete()
      .eq('tecnico_id', '1');
    
    if (deleteError) {
      console.log('⚠️ Erro ao remover localização anterior (pode não existir):', deleteError.message);
    } else {
      console.log('🧹 Localização anterior removida');
    }
    
    // Inserir nova localização
    const { data: locationData, error: insertError } = await supabase
      .from('tecnico_locations')
      .insert(testLocation)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      return NextResponse.json({
        success: false,
        error: insertError.message,
        details: insertError,
        test_data: testLocation,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Localização inserida com sucesso:', locationData);
    
    // Verificar se foi inserida corretamente
    const { data: verifyData, error: verifyError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .eq('tecnico_id', '1')
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar inserção:', verifyError);
    } else {
      console.log('✅ Verificação bem-sucedida:', verifyData);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Teste de localização bem-sucedido',
      data: {
        user: adminUser,
        location: locationData,
        verification: verifyData
      },
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
