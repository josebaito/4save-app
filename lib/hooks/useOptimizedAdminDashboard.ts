import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { optimizedQueries } from '@/lib/db/optimizedQueries';
// import { db } from '@/lib/db/supabase';
import type { DashboardStats, Ticket, User } from '@/types';

interface UseOptimizedDashboardProps {
  initialStats?: DashboardStats | null;
  initialTickets?: Ticket[];
  initialTecnicosOnline?: User[];
}

function useOptimizedAdminDashboard({
  initialStats = null,
  initialTickets = [],
  initialTecnicosOnline = []
}: UseOptimizedDashboardProps = {}) {
  const { status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(initialStats);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>(initialTickets); // "Recent" here actually stores ALL tickets for client-side filtering
  const [loading, setLoading] = useState(!initialStats); // If we have initial data, we are not loading!
  // Removed explicit state for notifications and ticketsEmExecucao
  // const [notifications, setNotifications] = useState<string[]>([]);
  // const [ticketsEmExecucao, setTicketsEmExecucao] = useState<Ticket[]>([]);
  const [tecnicosOnline, setTecnicosOnline] = useState<User[]>(initialTecnicosOnline);

  // Derived State: Tickets Em Execução
  // Calculated on the fly whenever recentTickets changes
  const ticketsEmExecucao = useMemo(() => {
    return recentTickets.filter(t => t.status === 'em_curso');
  }, [recentTickets]);

  // Derived State: Notifications
  const notifications = useMemo(() => {
    if (!recentTickets.length) return [];

    const newNotifications: string[] = [];

    // Tickets urgentes sem técnico
    const ticketsUrgentesSemTecnico = recentTickets.filter(t =>
      t.prioridade === 'urgente' && !t.tecnico_id && t.status === 'pendente'
    );

    if (ticketsUrgentesSemTecnico.length > 0) {
      newNotifications.push(`⚠️ ${ticketsUrgentesSemTecnico.length} ticket(s) urgente(s) sem técnico atribuído`);
    }

    // Tickets em curso há muito tempo (mais de 2 horas)
    const ticketsEmCursoLongo = recentTickets.filter(t => {
      if (t.status !== 'em_curso') return false;
      const inicio = new Date(t.created_at);
      const agora = new Date();
      const diffHoras = (agora.getTime() - inicio.getTime()) / (1000 * 60 * 60);
      return diffHoras > 2;
    });

    if (ticketsEmCursoLongo.length > 0) {
      newNotifications.push(`⏰ ${ticketsEmCursoLongo.length} ticket(s) em curso há mais de 2 horas`);
    }

    // Tickets cancelados
    const ticketsCancelados = recentTickets.filter(t => t.status === 'cancelado');
    if (ticketsCancelados.length > 0) {
      newNotifications.push(`❌ ${ticketsCancelados.length} ticket(s) cancelado(s) aguardando reativação`);
    }

    return newNotifications;
  }, [recentTickets]);

  // Wait, I shouldn't replace the notifications logic, just the loadDashboardData
  // Let me select the loadDashboardData function accurately

  const loadDashboardData = useCallback(async () => {
    try {
      // Dynamic import to avoid build issues, though getSession from top level is also fine now.
      // Better to align with the rest.
      const session: any = await getSession();
      const token = session?.accessToken;

      if (!token) return;

      // Usar queries otimizadas com cache
      const [dashboardStats, tickets] = await Promise.all([
        optimizedQueries.getDashboardStatsCached(token),
        optimizedQueries.getTicketsCached(token)
      ]);

      setStats(dashboardStats as DashboardStats);
      setRecentTickets(tickets as Ticket[]);

      // Buscar técnicos online com cache (mais eficiente)
      const tecnicosOnline = await optimizedQueries.getTecnicosOnlineCached(token);
      setTecnicosOnline(tecnicosOnline as User[]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it uses API directly


  // Verificação periódica de status online (otimizada)
  useEffect(() => {
    const checkOnlineStatus = async () => {
      // Only poll if window is focused to save resources? (Optional)
      // But for auth, let's get a fresh session token
      try {
        // Dynamic import is fine, but standard import is cleaner if we can. 
        // Let's stick to the existing pattern to minimize diff, but ensure it works.
        // Actually, let's just use the imported useSession's session if it's up to date? 
        // No, closure staleness.
        // Let's import getSession at the top level and use it.
        const session: any = await getSession();
        const token = session?.accessToken;

        if (!token) return;

        // Usar cache para técnicos online (mais eficiente)
        // Passar token para autenticação
        const tecnicosOnline = await optimizedQueries.getTecnicosOnlineCached(token);

        // Só atualizar se houve mudança significativa
        setTecnicosOnline(prev => {
          if (prev.length !== tecnicosOnline.length) {
            return tecnicosOnline as User[];
          }
          return prev;
        });
      } catch (error) {
        console.error('Erro ao verificar status online:', error);
      }
    };

    // Verificar a cada 30 segundos
    const interval = setInterval(checkOnlineStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated') return;
    loadDashboardData();
  }, [status, loadDashboardData]);

  return {
    stats,
    recentTickets,
    loading,
    notifications,
    tecnicosOnline,
    ticketsEmExecucao,
    refresh: loadDashboardData
  };
}

export { useOptimizedAdminDashboard };
