import { NextResponse } from 'next/server';
import { db } from '@/lib/db/supabase';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Testando verificação de cronogramas vencidos...');
    
    // Verificar cronogramas existentes
    const cronogramas = await db.getCronogramasManutencao();
    console.log(`📋 Total de cronogramas: ${cronogramas.length}`);
    
    // Verificar cronogramas vencidos
    const hoje = new Date().toISOString().split('T')[0];
    const cronogramasVencidos = cronogramas.filter(c => c.proxima_manutencao <= hoje);
    console.log(`📅 Cronogramas vencidos: ${cronogramasVencidos.length}`);
    
    // Verificar técnicos online
    const tecnicosOnline = await db.getTecnicosOnline();
    console.log(`👤 Técnicos online: ${tecnicosOnline.length}`);
    
    // Verificar técnicos realmente disponíveis (sem tickets em processo)
    const tecnicosDisponiveis = await db.getTecnicosOnlineDisponiveis();
    console.log(`👤 Técnicos disponíveis (sem tickets em processo): ${tecnicosDisponiveis.length}`);
    
    // Verificar tickets existentes antes
    const ticketsAntes = await db.getTickets();
    const ticketsManutencaoAntes = ticketsAntes.filter(t => t.tipo === 'manutencao');
    const ticketsSemTecnicoAntes = ticketsManutencaoAntes.filter(t => !t.tecnico_id);
    console.log(`📋 Tickets de manutenção existentes: ${ticketsManutencaoAntes.length}`);
    console.log(`📋 Tickets sem técnico: ${ticketsSemTecnicoAntes.length}`);
    
    // Executar verificação completa do sistema
    const resultado = await db.verificarSistemaCompleto();
    
    // Verificar tickets após execução
    const ticketsDepois = await db.getTickets();
    const ticketsManutencaoDepois = ticketsDepois.filter(t => t.tipo === 'manutencao');
    const ticketsSemTecnicoDepois = ticketsManutencaoDepois.filter(t => !t.tecnico_id);
    console.log(`📋 Tickets de manutenção após execução: ${ticketsManutencaoDepois.length}`);
    console.log(`📋 Tickets sem técnico após execução: ${ticketsSemTecnicoDepois.length}`);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      executionTime: `${executionTime}ms`,
      summary: {
        cronogramasTotal: cronogramas.length,
        cronogramasVencidos: cronogramasVencidos.length,
        tecnicosOnline: tecnicosOnline.length,
        tecnicosDisponiveis: tecnicosDisponiveis.length,
        ticketsAntes: ticketsManutencaoAntes.length,
        ticketsSemTecnicoAntes: ticketsSemTecnicoAntes.length,
        ticketsDepois: ticketsManutencaoDepois.length,
        ticketsSemTecnicoDepois: ticketsSemTecnicoDepois.length,
        ticketsCriados: resultado.ticketsCriados,
        ticketsAtribuidos: resultado.ticketsAtribuidos,
        tecnicosAtribuidos: resultado.tecnicosAtribuidos
      },
      cronogramasVencidos: cronogramasVencidos.map(c => ({
        id: c.id,
        contrato_id: c.contrato_id,
        proxima_manutencao: c.proxima_manutencao,
        tipo_manutencao: c.tipo_manutencao,
        status: c.status,
        contrato: c.contrato
      })),
      tecnicosOnline: tecnicosOnline.map(t => ({
        id: t.id,
        nome: t.name,
        especialidade: t.especialidade,
        status: t.status
      })),
      tecnicosDisponiveis: tecnicosDisponiveis.map(t => ({
        id: t.id,
        nome: t.name,
        especialidade: t.especialidade,
        status: t.status
      })),
      debug: {
        hoje: hoje,
        cronogramasVencidosDetalhes: cronogramasVencidos.map(c => ({
          id: c.id,
          contrato_id: c.contrato_id,
          proxima_manutencao: c.proxima_manutencao,
          contrato: c.contrato ? {
            id: c.contrato.id,
            cliente_id: c.contrato.cliente_id,
            numero: c.contrato.numero,
            cliente: c.contrato.cliente
          } : null
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
