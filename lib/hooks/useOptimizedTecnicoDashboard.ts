import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db/supabase';
import { simpleCache } from '@/lib/cache/simpleCache';
import { getCacheTTL, getInterval, shouldLog } from '@/lib/config/simplePerformance';
import type { Ticket } from '@/types';

function useOptimizedTecnicoDashboard() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTicketCount, setLastTicketCount] = useState(0);

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
      const data = await db.getTicketsByTecnico(session.user.id);
      
      // Cache por tempo configurado
      simpleCache.set(cacheKey, data, getCacheTTL('TICKETS'));
      
      setTickets(data);
      setLastTicketCount(data.length);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Heartbeat otimizado
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== 'tecnico') return;
    
    let heartbeatCount = 0;
    const heartbeat = async () => {
      try {
        await db.updateTecnicoOnlineStatus(session.user.id, true);
        heartbeatCount++;
        
        // Log apenas ocasionalmente
        if (shouldLog(heartbeatCount)) {
          console.log(`Tecnico dashboard heartbeat #${heartbeatCount}`);
        }
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    };
    
    // Primeiro heartbeat imediato
    heartbeat();
    
    // Heartbeat com intervalo configurado
    const interval = setInterval(heartbeat, getInterval('HEARTBEAT'));
    
    return () => {
      clearInterval(interval);
    };
  }, [session?.user?.id, session?.user?.type]);

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
