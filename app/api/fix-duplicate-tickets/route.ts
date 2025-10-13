import { NextResponse } from 'next/server';
import { db, createSupabaseClient } from '@/lib/db/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔍 Verificando tickets duplicados...');
    
    const supabase = db['supabase'] || createSupabaseClient();
    
    // Buscar todos os tickets de manutenção pendentes
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tipo', 'manutencao')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar tickets: ${error.message}`);
    }

    // Agrupar por contrato_id
    const ticketsPorContrato = new Map();
    const duplicados = [];

    tickets?.forEach(ticket => {
      const key = ticket.contrato_id;
      if (!ticketsPorContrato.has(key)) {
        ticketsPorContrato.set(key, []);
      }
      ticketsPorContrato.get(key).push(ticket);
    });

    // Identificar duplicados (mais de 1 ticket por contrato)
    ticketsPorContrato.forEach((ticketsContrato, contratoId) => {
      if (ticketsContrato.length > 1) {
        // Manter o mais recente, marcar os outros como duplicados
        const ordenados = ticketsContrato.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const ticketPrincipal = ordenados[0];
        const ticketsDuplicados = ordenados.slice(1);
        
        duplicados.push({
          contrato_id: contratoId,
          ticket_principal: ticketPrincipal,
          tickets_duplicados: ticketsDuplicados
        });
      }
    });

    return NextResponse.json({
      success: true,
      total_tickets: tickets?.length || 0,
      contratos_com_duplicados: duplicados.length,
      duplicados: duplicados,
      message: `Encontrados ${duplicados.length} contratos com tickets duplicados`
    });

  } catch (error) {
    console.error('❌ Erro ao verificar tickets duplicados:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🧹 Removendo tickets duplicados...');
    
    const supabase = db['supabase'] || createSupabaseClient();
    
    // Buscar todos os tickets de manutenção pendentes
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tipo', 'manutencao')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar tickets: ${error.message}`);
    }

    // Agrupar por contrato_id
    const ticketsPorContrato = new Map();
    tickets?.forEach(ticket => {
      const key = ticket.contrato_id;
      if (!ticketsPorContrato.has(key)) {
        ticketsPorContrato.set(key, []);
      }
      ticketsPorContrato.get(key).push(ticket);
    });

    let ticketsRemovidos = 0;
    const idsParaRemover = [];

    // Identificar duplicados para remoção
    ticketsPorContrato.forEach((ticketsContrato) => {
      if (ticketsContrato.length > 1) {
        // Manter o mais recente, remover os outros
        const ordenados = ticketsContrato.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const ticketsDuplicados = ordenados.slice(1);
        ticketsDuplicados.forEach(ticket => {
          idsParaRemover.push(ticket.id);
        });
      }
    });

    // Remover tickets duplicados
    if (idsParaRemover.length > 0) {
      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .in('id', idsParaRemover);

      if (deleteError) {
        throw new Error(`Erro ao remover tickets: ${deleteError.message}`);
      }

      ticketsRemovidos = idsParaRemover.length;
    }

    return NextResponse.json({
      success: true,
      tickets_removidos: ticketsRemovidos,
      message: `${ticketsRemovidos} tickets duplicados removidos com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro ao remover tickets duplicados:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
