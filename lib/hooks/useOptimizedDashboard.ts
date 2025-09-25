import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { optimizedQueries } from '@/lib/db/optimizedQueries';
import { useOptimizedTimers } from './useOptimizedTimers';
import type { DashboardStats, Ticket, User } from '@/types';

export function useOptimizedDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tecnicosOnline, setTecnicosOnline] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const [dashboardStats, ticketsData, tecnicosData] = await Promise.all([
        optimizedQueries.getDashboardStatsCached(),
        optimizedQueries.getTicketsCached(),
        optimizedQueries.getTecnicosOnlineCached()
      ]);

      setStats(dashboardStats as DashboardStats);
      setTickets(ticketsData as Ticket[]);
      setTecnicosOnline(tecnicosData as User[]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Configurar timers otimizados
  const timers = [
    {
      name: 'dashboard-refresh',
      interval: 2 * 60 * 1000, // 2 minutos
      callback: loadDashboardData,
      enabled: !!session?.user?.id
    }
  ];

  useOptimizedTimers(timers);

  useEffect(() => {
    if (status === 'loading') return;
    loadDashboardData();
  }, [status, loadDashboardData]);

  return {
    stats,
    tickets,
    tecnicosOnline,
    loading,
    refresh: loadDashboardData
  };
}
