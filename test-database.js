// Script para testar a conexão com o banco de dados
// Execute este script no Node.js para verificar se tudo está funcionando

const { createClient } = require('@supabase/supabase-js');

// Substitua pelas suas credenciais do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testando conexão com o banco de dados...\n');

  try {
    // Teste 1: Verificar se as tabelas existem
    console.log('1. Verificando tabelas...');
    
    const tables = ['users', 'clientes', 'contratos', 'tickets', 'relatorios_tecnicos', 'tecnico_locations'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ${err.message}`);
      }
    }

    // Teste 2: Verificar dados de exemplo
    console.log('\n2. Verificando dados de exemplo...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log(`❌ Erro ao buscar usuários: ${usersError.message}`);
    } else {
      console.log(`✅ Usuários encontrados: ${users?.length || 0}`);
    }

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(5);
    
    if (ticketsError) {
      console.log(`❌ Erro ao buscar tickets: ${ticketsError.message}`);
    } else {
      console.log(`✅ Tickets encontrados: ${tickets?.length || 0}`);
    }

    // Teste 3: Verificar estrutura da tabela relatorios_tecnicos
    console.log('\n3. Verificando estrutura da tabela relatorios_tecnicos...');
    
    const { data: relatorios, error: relatoriosError } = await supabase
      .from('relatorios_tecnicos')
      .select('*')
      .limit(1);
    
    if (relatoriosError) {
      console.log(`❌ Erro ao buscar relatórios: ${relatoriosError.message}`);
    } else {
      console.log(`✅ Relatórios encontrados: ${relatorios?.length || 0}`);
    }

    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testDatabase(); 