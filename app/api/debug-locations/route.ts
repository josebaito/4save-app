import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🔍 Debug: Investigando problema de unique constraint...');
    
    // 1. Verificar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar usuários',
        details: usersError
      }, { status: 500 });
    }
    
    console.log('👥 Usuários encontrados:', users?.length || 0);
    
    // 2. Verificar todas as localizações
    const { data: allLocations, error: locationsError } = await supabase
      .from('tecnico_locations')
      .select('*');
    
    if (locationsError) {
      console.log('❌ Erro ao buscar localizações:', locationsError);
    } else {
      console.log('📍 Total de localizações:', allLocations?.length || 0);
    }
    
    // 3. Verificar se há duplicatas
    const locationCounts: { [key: string]: number } = {};
    if (allLocations) {
      allLocations.forEach(loc => {
        locationCounts[loc.tecnico_id as string] = (locationCounts[loc.tecnico_id as string] || 0) + 1;
      });
    }
    
    const duplicates = Object.entries(locationCounts).filter(([, count]) => count > 1);
    
    // 4. Testar delete e insert para o primeiro usuário
    let testResult = null;
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log('🧪 Testando com usuário:', testUser.id);
      
      // Verificar localizações existentes para este usuário
      const { data: userLocations } = await supabase
        .from('tecnico_locations')
        .select('*')
        .eq('tecnico_id', testUser.id as string);
      
      console.log('📍 Localizações para usuário:', userLocations?.length || 0);
      
      if (userLocations && userLocations.length > 0) {
        // Tentar deletar todas
        const { error: deleteError } = await supabase
          .from('tecnico_locations')
          .delete()
          .eq('tecnico_id', testUser.id as string);
        
        console.log('🗑️ Resultado do delete:', deleteError ? 'Erro' : 'Sucesso');
        
        if (!deleteError) {
          // Aguardar um pouco
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Tentar inserir novamente
          const { data: insertData, error: insertError } = await supabase
            .from('tecnico_locations')
            .insert({
              tecnico_id: testUser.id,
              latitude: 38.7223,
              longitude: -9.1393,
              timestamp: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          testResult = {
            success: !insertError,
            error: insertError?.message || null,
            data: insertData
          };
          
          console.log('✅ Resultado do teste:', testResult);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug concluído',
      users: users || [],
      allLocations: allLocations || [],
      locationCounts: locationCounts,
      duplicates: duplicates,
      testResult: testResult
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro no debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
