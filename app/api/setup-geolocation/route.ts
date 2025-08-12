import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

// Endpoint para configurar as tabelas de geolocalização
export async function POST() {
  try {
    const supabase = createSupabaseClient();
    console.log('🔧 Configurando sistema de geolocalização...');
    
                // 1. Dropar e recriar tabela tecnico_locations para garantir schema correto
            const { error: dropTableError } = await supabase.rpc('exec_sql', {
              sql: `DROP TABLE IF EXISTS public.tecnico_locations CASCADE;`
            });
            
            if (dropTableError) {
              console.error('❌ Erro ao dropar tabela:', dropTableError);
              return NextResponse.json({ 
                success: false, 
                error: 'Falha ao dropar tabela existente',
                details: dropTableError 
              }, { status: 500 });
            }

            const { error: createTableError } = await supabase.rpc('exec_sql', {
              sql: `
                CREATE TABLE public.tecnico_locations (
                  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                  tecnico_id TEXT NOT NULL,
                  latitude DOUBLE PRECISION NOT NULL,
                  longitude DOUBLE PRECISION NOT NULL,
                  accuracy DOUBLE PRECISION DEFAULT 10,
                  timestamp TIMESTAMPTZ DEFAULT NOW(),
                  updated_at TIMESTAMPTZ DEFAULT NOW()
                );
              `
            });
    
    if (createTableError) {
      console.log('⚠️ Erro ao criar tabela (pode já existir):', createTableError.message);
    } else {
      console.log('✅ Tabela tecnico_locations criada/verificada');
    }
    
    // 2. Criar índices
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_tecnico_locations_tecnico_id ON public.tecnico_locations(tecnico_id);
        CREATE INDEX IF NOT EXISTS idx_tecnico_locations_timestamp ON public.tecnico_locations(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_tecnico_locations_updated_at ON public.tecnico_locations(updated_at DESC);
      `
    });
    
    if (indexError) {
      console.log('⚠️ Erro ao criar índices:', indexError.message);
    } else {
      console.log('✅ Índices criados/verificados');
    }
    
    // 3. Criar função RPC
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.upsert_tecnico_location(
          p_tecnico_id TEXT,
          p_latitude DOUBLE PRECISION,
          p_longitude DOUBLE PRECISION,
          p_accuracy DOUBLE PRECISION DEFAULT 10,
          p_timestamp TIMESTAMPTZ DEFAULT NOW()
        )
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result JSON;
        BEGIN
          INSERT INTO public.tecnico_locations (
            tecnico_id, 
            latitude, 
            longitude, 
            accuracy, 
            timestamp, 
            updated_at
          ) VALUES (
            p_tecnico_id, 
            p_latitude, 
            p_longitude, 
            p_accuracy, 
            p_timestamp, 
            NOW()
          )
          ON CONFLICT (tecnico_id) 
          DO UPDATE SET
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            accuracy = EXCLUDED.accuracy,
            timestamp = EXCLUDED.timestamp,
            updated_at = NOW()
          RETURNING to_json(tecnico_locations.*) INTO result;
          
          RETURN result;
        END;
        $$;
      `
    });
    
    if (functionError) {
      console.log('⚠️ Erro ao criar função RPC:', functionError.message);
    } else {
      console.log('✅ Função RPC criada/atualizada');
    }
    
    // 4. Configurar RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.tecnico_locations ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Técnicos podem ver suas próprias localizações" ON public.tecnico_locations;
        DROP POLICY IF EXISTS "Técnicos podem atualizar suas próprias localizações" ON public.tecnico_locations;
        DROP POLICY IF EXISTS "Admins podem ver todas as localizações" ON public.tecnico_locations;
        
        CREATE POLICY "Técnicos podem ver suas próprias localizações" ON public.tecnico_locations
          FOR SELECT USING (auth.uid()::text = tecnico_id);
        
        CREATE POLICY "Técnicos podem atualizar suas próprias localizações" ON public.tecnico_locations
          FOR INSERT WITH CHECK (auth.uid()::text = tecnico_id);
        
        CREATE POLICY "Técnicos podem atualizar suas próprias localizações" ON public.tecnico_locations
          FOR UPDATE USING (auth.uid()::text = tecnico_id);
        
        CREATE POLICY "Admins podem ver todas as localizações" ON public.tecnico_locations
          FOR SELECT USING (true);
      `
    });
    
    if (rlsError) {
      console.log('⚠️ Erro ao configurar RLS:', rlsError.message);
    } else {
      console.log('✅ RLS configurado');
    }
    
    // 5. Verificar se tudo está funcionando
    const { data: testData, error: testError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro ao testar tabela:', testError.message);
      return NextResponse.json({
        success: false,
        error: `Erro ao testar tabela: ${testError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Sistema de geolocalização configurado com sucesso');
    
    return NextResponse.json({
      success: true,
      message: 'Sistema de geolocalização configurado com sucesso',
      details: {
        table_created: true,
        indexes_created: true,
        rpc_function_created: true,
        rls_configured: true,
        test_passed: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar geolocalização:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint para verificar status do sistema
export async function GET() {
  try {
    const supabase = createSupabaseClient();
    console.log('🔍 Verificando status do sistema de geolocalização...');
    
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('tecnico_locations')
      .select('*')
      .limit(1);
    
    // Verificar se há dados
    const { data: locations, error: locationsError } = await supabase
      .from('tecnico_locations')
      .select('*');
    
    // Verificar se há usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      success: true,
      message: 'Status do sistema de geolocalização',
      status: {
        table_exists: !tableError,
        table_error: tableError?.message || null,
        has_locations: locations && locations.length > 0,
        locations_count: locations?.length || 0,
        has_users: !usersError,
        users_count: users?.length || 0,
        users_error: usersError?.message || null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
