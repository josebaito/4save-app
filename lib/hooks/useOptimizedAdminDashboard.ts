import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { optimizedQueries } from '@/lib/db/optimizedQueries';
// import { db } from '@/lib/db/supabase';
import type { DashboardStats, Ticket, User } from '@/types';

function useOptimizedAdminDashboard() {
  const { status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [tecnicosOnline, setTecnicosOnline] = useState<User[]>([]);
  const [ticketsEmExecucao, setTicketsEmExecucao] = useState<Ticket[]>([]);

  const checkNotifications = useCallback((tickets: Ticket[]) => {
    const newNotifications: string[] = [];
    
    // Tickets urgentes sem técnico
    const ticketsUrgentesSemTecnico = tickets.filter(t => 
      t.prioridade === 'urgente' && !t.tecnico_id && t.status === 'pendente'
    );
    
    if (ticketsUrgentesSemTecnico.length > 0) {
      newNotifications.push(`⚠️ ${ticketsUrgentesSemTecnico.length} ticket(s) urgente(s) sem técnico atribuído`);
    }
    
    // Tickets em curso há muito tempo (mais de 2 horas)
    const ticketsEmCursoLongo = tickets.filter(t => {
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
    const ticketsCancelados = tickets.filter(t => t.status === 'cancelado');
    if (ticketsCancelados.length > 0) {
      newNotifications.push(`❌ ${ticketsCancelados.length} ticket(s) cancelado(s) aguardando reativação`);
    }
    
    setNotifications(newNotifications);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      // Usar queries otimizadas com cache
      const [dashboardStats, tickets] = await Promise.all([
        optimizedQueries.getDashboardStatsCached(),
        optimizedQueries.getTicketsCached()
      ]);

      setStats(dashboardStats as DashboardStats);
      setRecentTickets((tickets as Ticket[]).slice(0, 5));
      
      // Buscar técnicos online com cache (mais eficiente)
      const tecnicosOnline = await optimizedQueries.getTecnicosOnlineCached();
      setTecnicosOnline(tecnicosOnline as User[]);
      
      const ticketsEmCurso = (tickets as Ticket[]).filter(t => t.status === 'em_curso');
      setTicketsEmExecucao(ticketsEmCurso);
      
      // Verificar notificações
      checkNotifications(tickets as Ticket[]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [checkNotifications]);


  // Verificação periódica de status online (otimizada)
  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        // Usar cache para técnicos online (mais eficiente)
        const tecnicosOnline = await optimizedQueries.getTecnicosOnlineCached();
        
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
    if (status === 'loading') return;
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
