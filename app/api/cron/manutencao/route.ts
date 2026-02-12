import { NextResponse } from 'next/server';
import { db } from '@/lib/db/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔄 Iniciando geração automática de tickets de manutenção...');
    
    // Gerar tickets de manutenção baseado no cronograma
    const token = (session as any)?.accessToken;
    await db.gerarTicketsManutencao(token);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Tickets de manutenção gerados com sucesso em ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tickets de manutenção gerados com sucesso',
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`❌ Erro ao gerar tickets de manutenção após ${duration}ms:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint para testar manualmente
export async function POST() {
  const startTime = Date.now();
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🧪 Teste manual de geração de tickets de manutenção...');
    
    // Verificar cronogramas existentes
    const token = (session as any)?.accessToken;
    const cronogramas = await db.getCronogramasManutencao(token);
    
    console.log('📊 Dados dos cronogramas encontrados:');
    cronogramas.forEach((c, i) => {
      console.log(`  ${i + 1}. ID: ${c.id}`);
      console.log(`     Contrato: ${c.contrato?.numero || 'N/A'}`);
      console.log(`     Tipo: ${c.tipo_manutencao}`);
      console.log(`     Frequência: ${c.frequencia}`);
      console.log(`     Próxima manutenção: ${c.proxima_manutencao}`);
      console.log(`     Status: ${c.status}`);
      console.log(`     Data atual: ${new Date().toISOString().split('T')[0]}`);
      console.log(`     Está vencido? ${c.proxima_manutencao <= new Date().toISOString().split('T')[0]}`);
      console.log('---');
    });
    
    if (cronogramas.length === 0) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhum cronograma de manutenção encontrado',
        cronogramas_encontrados: 0,
        tickets_gerados: 0,
        duration_ms: duration,
        debug_info: {
          data_atual: new Date().toISOString().split('T')[0],
          total_cronogramas: 0
        },
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`📋 Encontrados ${cronogramas.length} cronogramas para processar`);
    
    // Verificar tickets existentes antes da geração
    const ticketsAntes = await db.getTickets(token);
    const ticketsManutencaoAntes = ticketsAntes.filter(t => t.tipo === 'manutencao');
    console.log(`📋 Tickets de manutenção existentes antes: ${ticketsManutencaoAntes.length}`);
    
    // Gerar tickets
    await db.gerarTicketsManutencao(token);
    
    // Verificar tickets gerados
    const ticketsDepois = await db.getTickets(token);
    const ticketsManutencaoDepois = ticketsDepois.filter(t => t.tipo === 'manutencao');
    const ticketsNovos = ticketsManutencaoDepois.length - ticketsManutencaoAntes.length;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Teste concluído com sucesso em ${duration}ms`);
    console.log(`📊 Resultados: ${cronogramas.length} cronogramas processados, ${ticketsNovos} tickets novos gerados`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste de geração de tickets concluído',
      cronogramas_encontrados: cronogramas.length,
      tickets_gerados: ticketsNovos,
      tickets_antes: ticketsManutencaoAntes.length,
      tickets_depois: ticketsManutencaoDepois.length,
      duration_ms: duration,
      debug_info: {
        data_atual: new Date().toISOString().split('T')[0],
        cronogramas_vencidos: cronogramas.filter(c => c.proxima_manutencao <= new Date().toISOString().split('T')[0]).length,
        cronogramas_proximos: cronogramas.filter(c => {
          const hoje = new Date().toISOString().split('T')[0];
          const dataLimite = new Date();
          dataLimite.setDate(dataLimite.getDate() + 7);
          const dataLimiteStr = dataLimite.toISOString().split('T')[0];
          return c.proxima_manutencao > hoje && c.proxima_manutencao <= dataLimiteStr;
        }).length
      },
      performance: {
        ms_por_cronograma: cronogramas.length > 0 ? Math.round(duration / cronogramas.length) : 0,
        cronogramas_por_segundo: cronogramas.length > 0 ? Math.round((cronogramas.length / duration) * 1000) : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`❌ Erro no teste após ${duration}ms:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT removed for security (no unauthenticated execution)
