import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🎫 Listando todos os tickets...');
    
    // Buscar todos os tickets
    const { data: tickets, error: errorTickets } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (errorTickets) {
      console.error('Erro ao buscar tickets:', errorTickets);
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar tickets: ${errorTickets.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Separar tickets por tipo
    const ticketsInstalacao = tickets?.filter(t => t.tipo === 'instalacao') || [];
    const ticketsManutencao = tickets?.filter(t => t.tipo === 'manutencao') || [];
    
    console.log(`📊 Total de tickets: ${tickets?.length || 0}`);
    console.log(`🔧 Tickets de instalação: ${ticketsInstalacao.length}`);
    console.log(`🔧 Tickets de manutenção: ${ticketsManutencao.length}`);
    
    return NextResponse.json({
      success: true,
      message: 'Lista de tickets obtida com sucesso',
      tickets: {
        total: tickets?.length || 0,
        instalacao: ticketsInstalacao,
        manutencao: ticketsManutencao,
        todos: tickets || []
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar tickets:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
