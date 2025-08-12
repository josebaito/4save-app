'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wifi, WifiOff, Clock } from 'lucide-react';
import { db } from '@/lib/db/supabase';
import type { User } from '@/types';

interface OnlineStatusCardProps {
  refreshInterval?: number; // em milissegundos
}

export function OnlineStatusCard({ refreshInterval = 30000 }: OnlineStatusCardProps) {
  const [tecnicosOnline, setTecnicosOnline] = useState<User[]>([]);
  const [totalTecnicos, setTotalTecnicos] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadOnlineStatus = async () => {
    try {
      const [tecnicosOnline, todosTecnicos] = await Promise.all([
        db.getTecnicosOnline(),
        db.getTecnicos()
      ]);

      setTecnicosOnline(tecnicosOnline);
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
    if (tecnicosOnline.length === 0) return 0;
    
    const now = Date.now();
    const totalMinutes = tecnicosOnline.reduce((total, tecnico) => {
      if (tecnico.last_seen) {
        const lastSeen = new Date(tecnico.last_seen).getTime();
        return total + Math.round((now - lastSeen) / 60000);
      }
      return total;
    }, 0);
    
    return Math.round(totalMinutes / tecnicosOnline.length);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            Status Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-green-600" />
          Status Online
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tecnicosOnline.length}
            </div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {totalTecnicos - tecnicosOnline.length}
            </div>
            <div className="text-sm text-gray-600">Offline</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Taxa de Online</span>
            <span className="font-medium">{getOnlinePercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getOnlinePercentage()}%` }}
            ></div>
          </div>
        </div>
        
        {tecnicosOnline.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Tempo médio online: {getAverageOnlineTime()}min</span>
            </div>
          </div>
        )}
        
        {tecnicosOnline.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Técnicos Online:</div>
            <div className="space-y-1">
              {tecnicosOnline.slice(0, 3).map((tecnico) => (
                <div key={tecnico.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700">{tecnico.name}</span>
                  {tecnico.last_seen && (
                    <span className="text-xs text-gray-500">
                      ({Math.round((Date.now() - new Date(tecnico.last_seen).getTime()) / 60000)}min)
                    </span>
                  )}
                </div>
              ))}
              {tecnicosOnline.length > 3 && (
                <div className="text-xs text-gray-500">
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