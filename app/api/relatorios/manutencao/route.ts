import { NextResponse } from 'next/server';
import { db } from '@/lib/db/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { format, parseISO, isAfter, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = (session as any)?.accessToken || request.headers.get('Authorization')?.split(' ')[1];

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || '3'; // Padrão: 3 meses
    const tecnicoId = searchParams.get('tecnico_id');
    const contratoId = searchParams.get('contrato_id');
    const tipoManutencao = searchParams.get('tipo_manutencao');

    // Verificar permissões (apenas admin pode ver relatórios de todos os técnicos)
    const userRole = session.user.type;
    const userId = session.user.id;

    if (userRole !== 'admin' && tecnicoId && tecnicoId !== userId) {
      return NextResponse.json({ error: 'Não autorizado a ver relatórios de outros técnicos' }, { status: 403 });
    }

    // Definir período de busca
    const dataInicio = subMonths(new Date(), parseInt(periodo));

    // Buscar histórico de manutenção
    let historicoManutencao = await db.getHistoricoManutencao(token);

    // Filtrar por período
    historicoManutencao = historicoManutencao.filter(h => {
      if (!h.data_realizada) return false;
      const dataRealizada = parseISO(h.data_realizada);
      return isAfter(dataRealizada, dataInicio);
    });

    // Aplicar filtros adicionais
    if (contratoId) {
      historicoManutencao = historicoManutencao.filter(h => h.contrato_id === contratoId);
    }

    if (tipoManutencao) {
      historicoManutencao = historicoManutencao.filter(h => h.tipo_manutencao === tipoManutencao);
    }

    // Buscar tickets de manutenção
    let tickets = await db.getTickets(token);
    tickets = tickets.filter(t => t.tipo === 'manutencao');

    // Filtrar por período
    tickets = tickets.filter(t => {
      if (!t.updated_at) return false;
      const dataFinalizacao = parseISO(t.updated_at);
      return isAfter(dataFinalizacao, dataInicio);
    });

    // Aplicar filtros adicionais
    if (tecnicoId) {
      tickets = tickets.filter(t => t.tecnico_id === tecnicoId);
    }

    if (contratoId) {
      tickets = tickets.filter(t => t.contrato_id === contratoId);
    }

    // Buscar relatórios técnicos associados a tickets de manutenção
    const relatorios = [];

    // Por enquanto, vamos usar apenas os dados dos tickets
    // TODO: Implementar busca de relatórios técnicos quando necessário

    // Preparar dados para o relatório
    const dadosRelatorio = {
      periodo: `${format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`,
      totalManutencoes: historicoManutencao.length,
      totalTickets: tickets.length,
      totalRelatorios: relatorios.length,
      porTipoManutencao: {
        preventiva: historicoManutencao.filter(h => h.tipo_manutencao === 'preventiva').length,
        corretiva: historicoManutencao.filter(h => h.tipo_manutencao === 'corretiva').length,
        preditiva: historicoManutencao.filter(h => h.tipo_manutencao === 'preditiva').length,
      },
      porStatus: {
        finalizados: tickets.filter(t => t.status === 'finalizado').length,
        emAndamento: tickets.filter(t => t.status === 'em_curso').length,
        pendentes: tickets.filter(t => t.status === 'pendente').length,
        cancelados: tickets.filter(t => t.status === 'cancelado').length,
      },
      historicoRecente: historicoManutencao
        .sort((a, b) => {
          if (!a.data_realizada || !b.data_realizada) return 0;
          return parseISO(b.data_realizada).getTime() - parseISO(a.data_realizada).getTime();
        })
        .slice(0, 10)
        .map(h => ({
          id: h.id,
          contrato_id: h.contrato_id,
          contrato_descricao: h.contrato?.descricao || 'N/A',
          cliente_nome: h.contrato?.cliente?.nome || 'N/A',
          tipo_manutencao: h.tipo_manutencao,
          data_realizada: h.data_realizada ? format(parseISO(h.data_realizada), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
          observacoes: h.observacoes || '',
          ticket_id: h.ticket_id,
        })),
      ticketsRecentes: tickets
        .sort((a, b) => {
          if (!a.updated_at || !b.updated_at) return 0;
          return parseISO(b.updated_at).getTime() - parseISO(a.updated_at).getTime();
        })
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          titulo: t.titulo,
          status: t.status,
          prioridade: t.prioridade,
          cliente_nome: t.cliente?.nome || 'N/A',
          tecnico_nome: t.tecnico?.name || 'N/A',
          data_criacao: t.created_at ? format(parseISO(t.created_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
          data_finalizacao: t.updated_at ? format(parseISO(t.updated_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
          relatorio_id: t.relatorio?.id || null,
        })),
    };

    return NextResponse.json(dadosRelatorio);
  } catch (error) {
    console.error('❌ Erro ao gerar relatório de manutenção:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}