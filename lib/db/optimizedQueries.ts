import { api } from './api';
import { simpleCache } from '@/lib/cache/simpleCache';
import type { Ticket, User, DashboardStats } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const optimizedQueries = {
  // Cache de 2 minutos para dados que mudam pouco
  async getTicketsCached(token?: string): Promise<Ticket[]> {
    const cacheKey = 'tickets_all';
    const cached = simpleCache.get(cacheKey);

    if (cached) {
      return cached as Ticket[];
    }

    try {
      const data = await api.tickets.list(token);
      // Cache por 2 minutos
      simpleCache.set(cacheKey, data || [], 2 * 60 * 1000);
      return data || [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  },

  async getTicketsByTecnicoCached(tecnicoId: string, token?: string): Promise<Ticket[]> {
    const cacheKey = `tickets_tecnico_${tecnicoId}`;
    const cached = simpleCache.get(cacheKey);

    if (cached) {
      return cached as Ticket[];
    }

    try {
      const data = await api.tickets.listByTecnico(tecnicoId, token);
      // Cache por 1 minuto
      simpleCache.set(cacheKey, data || [], 60 * 1000);
      return data || [];
    } catch (error) {
      console.error('Error fetching technician tickets:', error);
      return [];
    }
  },

  // Query direta para status online
  async getTecnicosOnlineCached(token?: string): Promise<User[]> {
    try {
      const users: any[] = await api.users.getOnline(token);
      return users.filter((u: any) => u.type === 'tecnico' && u.is_online);
    } catch (error) {
      console.error('Error fetching online technicians:', error);
      return [];
    }
  },

  // Cache de 5 minutos para estatísticas
  async getDashboardStatsCached(token?: string): Promise<DashboardStats> {
    const cacheKey = 'dashboard_stats';
    const cached = simpleCache.get(cacheKey);

    if (cached) {
      return cached as DashboardStats;
    }

    try {
      const stats = await api.relatorios.getStats(token);
      // Cache por 5 minutos
      simpleCache.set(cacheKey, stats, 5 * 60 * 1000);
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        total_clientes: 0,
        total_contratos: 0,
        total_tickets: 0,
        tickets_pendentes: 0,
        tickets_em_curso: 0,
        tickets_finalizados: 0,
        tickets_finalizados_mes: 0,
        contratos_ativos: 0,
        contratos_inativos: 0,
        contratos_vencidos: 0,
        tecnicos_ativos: 0
      };
    }
  },

  // Invalidar cache
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
