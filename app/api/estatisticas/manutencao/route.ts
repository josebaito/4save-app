import { NextResponse } from 'next/server';
import { db } from '@/lib/db/supabase';
import { parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Prefer token from session (server-side), fallback to header
    const token = (session as any)?.accessToken || request.headers.get('Authorization')?.split(' ')[1];

    const userId = session.user.id;
    const userRole = session.user.type;

    const hoje = new Date();
    const proximaSemana = addDays(hoje, 7);

    // Estatísticas diferentes para admin e técnico
    if (userRole === 'admin') {
      // Para admin: estatísticas globais
      const cronogramas = await db.getCronogramasManutencao(token);
      const tickets = await db.getTickets(token);
      const ticketsManutencao = tickets.filter(t => t.tipo === 'manutencao');

      // Próximas manutenções (dentro de 7 dias)
      const proximasManutencoes = cronogramas.filter(c => {
        if (!c.proxima_manutencao) return false;
        const dataProxima = parseISO(c.proxima_manutencao);
        return isAfter(dataProxima, hoje) && isBefore(dataProxima, proximaSemana);
      }).length;

      // Manutenções pendentes (data já passou mas não tem ticket finalizado)
      const manutencoesPendentes = cronogramas.filter(c => {
        if (!c.proxima_manutencao) return false;
        const dataProxima = parseISO(c.proxima_manutencao);
        return isBefore(dataProxima, hoje) && !ticketsManutencao.some(t =>
          t.contrato_id === c.contrato_id &&
          t.status === 'finalizado' &&
          t.updated_at &&
          isAfter(parseISO(t.updated_at), dataProxima)
        );
      }).length;

      // Manutenções realizadas (tickets finalizados)
      const manutencoesRealizadas = ticketsManutencao.filter(t =>
        t.status === 'finalizado'
      ).length;

      // Tickets abertos de manutenção
      const ticketsAbertos = ticketsManutencao.filter(t =>
        t.status !== 'finalizado' && t.status !== 'cancelado'
      ).length;

      return NextResponse.json({
        proximasManutencoes,
        manutencoesPendentes,
        manutencoesRealizadas,
        ticketsAbertos,
        totalCronogramas: cronogramas.length,
        totalTicketsManutencao: ticketsManutencao.length
      });
    } else {
      // Para técnico: estatísticas apenas dos seus tickets
      const tickets = await db.getTicketsByTecnico(userId, token);
      const ticketsManutencao = tickets.filter(t => t.tipo === 'manutencao');

      // Tickets abertos de manutenção
      const ticketsAbertos = ticketsManutencao.filter(t =>
        t.status !== 'finalizado' && t.status !== 'cancelado'
      ).length;

      // Manutenções realizadas (tickets finalizados)
      const manutencoesRealizadas = ticketsManutencao.filter(t =>
        t.status === 'finalizado'
      ).length;

      // Carregar cronograma de manutenção
      // Idealmente, filtrar apenas para o técnico atual, mas como não temos esse campo,
      // vamos considerar todos os cronogramas associados aos contratos dos tickets deste técnico
      const cronogramas = [];
      const contratosIds = new Set<string>();

      // Coletar IDs de contratos dos tickets deste técnico
      ticketsManutencao.forEach(ticket => {
        if (ticket.contrato_id) {
          contratosIds.add(ticket.contrato_id);
        }
      });

      // Buscar cronogramas para estes contratos
      for (const contratoId of contratosIds) {
        try {
          const allCronogramas = await db.getCronogramasManutencao(token);
          const cronogramasContrato = allCronogramas.filter(c => c.contrato_id === contratoId);
          cronogramas.push(...cronogramasContrato);
        } catch (e) {
          console.error(`Erro ao buscar cronogramas para contrato ${contratoId}:`, e);
        }
      }

      // Próximas manutenções (dentro de 7 dias)
      const proximasManutencoes = cronogramas.filter(c => {
        if (!c.proxima_manutencao) return false;
        const dataProxima = parseISO(c.proxima_manutencao);
        return isAfter(dataProxima, hoje) && isBefore(dataProxima, proximaSemana);
      }).length;

      // Manutenções pendentes (data já passou mas não tem ticket finalizado)
      const manutencoesPendentes = cronogramas.filter(c => {
        if (!c.proxima_manutencao) return false;
        const dataProxima = parseISO(c.proxima_manutencao);
        return isBefore(dataProxima, hoje) && !ticketsManutencao.some(t =>
          t.contrato_id === c.contrato_id &&
          t.status === 'finalizado' &&
          t.updated_at &&
          isAfter(parseISO(t.updated_at), dataProxima)
        );
      }).length;

      return NextResponse.json({
        proximasManutencoes,
        manutencoesPendentes,
        manutencoesRealizadas,
        ticketsAbertos
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de manutenção:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
