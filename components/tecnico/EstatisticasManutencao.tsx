'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface EstatisticasManutencao {
  proximasManutencoes: number;
  manutencoesPendentes: number;
  manutencoesRealizadas: number;
  ticketsAbertos: number;
}

export function EstatisticasManutencao() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<EstatisticasManutencao>({
    proximasManutencoes: 0,
    manutencoesPendentes: 0,
    manutencoesRealizadas: 0,
    ticketsAbertos: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Carregando estatísticas de manutenção...');
      console.log('📊 Sessão:', session?.user?.id, session?.user?.type);

      if (!session?.user?.id) {
        console.log('📊 Usuário não autenticado, aguardando...');
        return;
      }

      const token = (session as any)?.accessToken;

      const response = await fetch('/api/estatisticas/manutencao', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📊 Erro na resposta:', errorText);
        throw new Error(`Falha ao carregar estatísticas: ${response.status}`);
      }

      const data = await response.json();

      setStats({
        proximasManutencoes: data.proximasManutencoes || 0,
        manutencoesPendentes: data.manutencoesPendentes || 0,
        manutencoesRealizadas: data.manutencoesRealizadas || 0,
        ticketsAbertos: data.ticketsAbertos || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas de manutenção');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.type]);

  useEffect(() => {
    if (session?.user?.id) {
      loadStats();
    }
  }, [session?.user?.id, loadStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-slate-600 rounded animate-pulse"></div>
              <div className="h-5 w-5 bg-slate-600 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-slate-600 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-24 bg-slate-600 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white/10 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:bg-white/15">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">
            Próximas Manutenções
          </CardTitle>
          <Calendar className="h-5 w-5 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.proximasManutencoes}</div>
          <p className="text-xs text-slate-300 mt-1">
            Agendadas para os próximos 7 dias
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:bg-white/15">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">
            Manutenções Pendentes
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.manutencoesPendentes}</div>
          <p className="text-xs text-slate-300 mt-1">
            Manutenções vencidas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:bg-white/15">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">
            Manutenções Realizadas
          </CardTitle>
          <CheckCircle className="h-5 w-5 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.manutencoesRealizadas}</div>
          <p className="text-xs text-slate-300 mt-1">
            Total de manutenções concluídas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:bg-white/15">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">
            Tickets Abertos
          </CardTitle>
          <Clock className="h-5 w-5 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.ticketsAbertos}</div>
          <p className="text-xs text-slate-300 mt-1">
            Tickets de manutenção em andamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}