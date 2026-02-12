'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Clock } from 'lucide-react';
import { optimizedQueries } from '@/lib/db/optimizedQueries';
import { db } from '@/lib/db/supabase';
import type { User } from '@/types';
import { useTimeAgo, useClientTime } from '@/lib/hooks/useClientTime';

// Client-side only component to avoid hydration mismatch
function TimeAgo({ lastSeen }: { lastSeen: string }) {
  const timeAgo = useTimeAgo(lastSeen);
  
  if (!timeAgo) return null; // Don't render on server

  return <span className="text-xs text-slate-500">({timeAgo})</span>;
}

interface OnlineStatusCardProps {
  refreshInterval?: number; // em milissegundos
}

export function OnlineStatusCard({ refreshInterval = 30000 }: OnlineStatusCardProps) {
  const { data: session } = useSession();
  const [tecnicosOnline, setTecnicosOnline] = useState<User[]>([]);
  const [totalTecnicos, setTotalTecnicos] = useState(0);
  const [loading, setLoading] = useState(true);
  const currentTime = useClientTime();

  const loadOnlineStatus = async () => {
    try {
      const token = (session as any)?.accessToken;
      if (!token) return;
      // Usar queries otimizadas com cache
      const [tecnicosOnline, todosTecnicos] = await Promise.all([
        optimizedQueries.getTecnicosOnlineCached(token),
        db.getTecnicos(token) // Manter query original para total (dados menos frequentes)
      ]);

      setTecnicosOnline(tecnicosOnline as User[]);
      setTotalTecnicos(todosTecnicos.length);
    } catch (error) {
      console.error('Erro ao carregar status online:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnlineStatus();
    
    const interval = setInterval(loadOnlineStatus, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getOnlinePercentage = () => {
    if (totalTecnicos === 0) return 0;
    return Math.round((tecnicosOnline.length / totalTecnicos) * 100);
  };

  const getAverageOnlineTime = () => {
    if (tecnicosOnline.length === 0 || !currentTime) return 0;
    
    const totalMinutes = tecnicosOnline.reduce((total, tecnico) => {
      if (tecnico.last_seen) {
        const lastSeen = new Date(tecnico.last_seen).getTime();
        return total + Math.round((currentTime - lastSeen) / 60000);
      }
      return total;
    }, 0);
    
    return Math.round(totalMinutes / tecnicosOnline.length);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wifi className="h-5 w-5 text-green-400" />
            Status Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wifi className="h-5 w-5 text-green-400" />
          Status Online
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {tecnicosOnline.length}
            </div>
            <div className="text-sm text-slate-400">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-400">
              {totalTecnicos - tecnicosOnline.length}
            </div>
            <div className="text-sm text-slate-400">Offline</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Taxa de Online</span>
            <span className="font-medium text-white">{getOnlinePercentage()}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getOnlinePercentage()}%` }}
            ></div>
          </div>
        </div>
        
        {tecnicosOnline.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Tempo médio online: {getAverageOnlineTime()}min</span>
            </div>
          </div>
        )}
        
        {tecnicosOnline.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Técnicos Online:</div>
            <div className="space-y-1">
              {tecnicosOnline.slice(0, 3).map((tecnico) => (
                <div key={tecnico.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-300">{tecnico.name}</span>
                  {tecnico.last_seen && <TimeAgo lastSeen={tecnico.last_seen} />}
                </div>
              ))}
              {tecnicosOnline.length > 3 && (
                <div className="text-xs text-slate-500">
                  +{tecnicosOnline.length - 3} mais online
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 