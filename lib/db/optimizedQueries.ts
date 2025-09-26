import { createSupabaseClient } from './supabase';
import { simpleCache } from '@/lib/cache/simpleCache';

const optimizedQueries = {
  // Cache de 2 minutos para dados que mudam pouco
  async getTicketsCached(): Promise<unknown[]> {
    const cacheKey = 'tickets_all';
    const cached = simpleCache.get(cacheKey);
    
    if (cached) {
      return cached as unknown[];
    }
    
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        titulo,
        descricao,
        status,
        prioridade,
        created_at,
        updated_at,
        cliente:clientes(id, nome, email),
        tecnico:users(id, name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Cache por 2 minutos
    simpleCache.set(cacheKey, data || [], 2 * 60 * 1000);
    return data || [];
  },
  
  // Query direta para status online (sem cache para tempo real)
  async getTecnicosOnlineCached(): Promise<unknown[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, last_seen, is_online, especialidade, disponibilidade')
      .eq('type', 'tecnico')
      .eq('status', 'ativo')
      .eq('is_online', true)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  },
  
  // Cache de 5 minutos para estatísticas
  async getDashboardStatsCached(): Promise<unknown> {
    const cacheKey = 'dashboard_stats';
    const cached = simpleCache.get(cacheKey);
    
    if (cached) {
      return cached as unknown[];
    }
    
    const supabase = createSupabaseClient();
    const [clientes, ticketsPendentes, tecnicos, ticketsFinalizados] = await Promise.all([
      supabase.from('clientes').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('type', 'tecnico'),
      supabase.from('tickets').select('id', { count: 'exact', head: true })
        .eq('status', 'finalizado')
        .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    const stats = {
      total_clientes: clientes.count || 0,
      tickets_pendentes: ticketsPendentes.count || 0,
      tecnicos_ativos: tecnicos.count || 0,
      tickets_finalizados_mes: ticketsFinalizados.count || 0,
    };
    
    // Cache por 5 minutos
    simpleCache.set(cacheKey, stats, 5 * 60 * 1000);
    return stats;
  },
  
  // Invalidar cache quando dados são atualizados
  invalidateTicketsCache(): void {
    simpleCache.invalidate('tickets');
  },
  
  invalidateTecnicosCache(): void {
    simpleCache.invalidate('tecnicos');
  },
  
  invalidateStatsCache(): void {
    simpleCache.invalidate('dashboard');
  }
};

export { optimizedQueries };
