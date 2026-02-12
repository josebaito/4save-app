import { NextResponse } from 'next/server';
import { db } from '@/lib/db/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const token = (session as any)?.accessToken;
    console.log('🧪 Testando geração automática de tickets com atribuição de técnicos...');
    
    // Verificar cronogramas existentes
    const cronogramas = await db.getCronogramasManutencao(token);
    console.log(`📋 Encontrados ${cronogramas.length} cronogramas`);
    
    // Verificar técnicos online
    const tecnicosOnline = await db.getTecnicosOnline(token);
    console.log(`👤 Técnicos online: ${tecnicosOnline.length}`);
    
    // Verificar tickets existentes antes
    const ticketsAntes = await db.getTickets(token);
    const ticketsManutencaoAntes = ticketsAntes.filter(t => t.tipo === 'manutencao');
    console.log(`📋 Tickets de manutenção existentes: ${ticketsManutencaoAntes.length}`);
    
    // Executar geração automática
    await db.gerarTicketsManutencao(token);
    
    // Verificar tickets gerados
    const ticketsDepois = await db.getTickets(token);
    const ticketsManutencaoDepois = ticketsDepois.filter(t => t.tipo === 'manutencao');
    const ticketsNovos = ticketsManutencaoDepois.length - ticketsManutencaoAntes.length;
    
    // Verificar quantos tickets foram atribuídos
    const ticketsComTecnico = ticketsManutencaoDepois.filter(t => t.tecnico_id);
    const ticketsSemTecnico = ticketsManutencaoDepois.filter(t => !t.tecnico_id);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Teste concluído em ${duration}ms`);
    console.log(`📊 Resultados: ${ticketsNovos} tickets novos gerados`);
    console.log(`👤 Tickets com técnico: ${ticketsComTecnico.length}`);
    console.log(`⚠️ Tickets sem técnico: ${ticketsSemTecnico.length}`);
    
    return NextResponse.json({
      success: true,
      message: 'Teste de geração automática concluído',
      resultados: {
        cronogramas_encontrados: cronogramas.length,
        tecnicos_online: tecnicosOnline.length,
        tickets_gerados: ticketsNovos,
        tickets_com_tecnico: ticketsComTecnico.length,
        tickets_sem_tecnico: ticketsSemTecnico.length,
        tickets_antes: ticketsManutencaoAntes.length,
        tickets_depois: ticketsManutencaoDepois.length
      },
      tecnicos_online: tecnicosOnline.map(t => ({
        id: t.id,
        name: t.name,
        especialidade: t.especialidade,
        avaliacao: t.avaliacao,
        is_online: t.is_online,
        disponibilidade: t.disponibilidade
      })),
      tickets_novos: ticketsManutencaoDepois
        .filter(t => !ticketsManutencaoAntes.some(ta => ta.id === t.id))
        .map(t => ({
          id: t.id,
          titulo: t.titulo,
          tecnico_id: t.tecnico_id,
          tecnico_nome: t.tecnico?.name || 'Sem técnico',
          prioridade: t.prioridade,
          status: t.status
        })),
      duration_ms: duration,
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
