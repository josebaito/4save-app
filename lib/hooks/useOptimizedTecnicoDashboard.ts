import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db/supabase';
import { simpleCache } from '@/lib/cache/simpleCache';
import { getCacheTTL, getInterval, shouldLog } from '@/lib/config/simplePerformance';
import type { Ticket } from '@/types';

function useOptimizedTecnicoDashboard(initialTickets: Ticket[] = []) {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [loading, setLoading] = useState(initialTickets.length === 0);
  const [lastTicketCount, setLastTicketCount] = useState(initialTickets.length);

  const loadTickets = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Verificar cache primeiro
      const cacheKey = `tickets_tecnico_${session.user.id}`;
      const cachedTickets = simpleCache.get(cacheKey);

      if (cachedTickets) {
        setTickets(cachedTickets as Ticket[]);
        setLastTicketCount((cachedTickets as Ticket[]).length);
        setLoading(false);
        return;
      }

      // Se não há cache, buscar do banco
      const token = (session as any)?.accessToken;
      if (!token) return;

      const data = await db.getTicketsByTecnico(session.user.id, token);

      // Cache por tempo configurado
      simpleCache.set(cacheKey, data, getCacheTTL('TICKETS'));

      setTickets(data);
      setLastTicketCount(data.length);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);


  useEffect(() => {
    if (status === 'loading') return;
    loadTickets();
  }, [status, loadTickets]);

  // Função para invalidar cache quando tickets são atualizados
  const invalidateCache = useCallback(() => {
    if (session?.user?.id) {
      const cacheKey = `tickets_tecnico_${session.user.id}`;
      simpleCache.invalidate(cacheKey);
    }
  }, [session?.user?.id]);

  return {
    tickets,
    loading,
    lastTicketCount,
    loadTickets,
    invalidateCache
  };
}

export { useOptimizedTecnicoDashboard };
