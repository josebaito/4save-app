'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (session?.user?.id) {
      loadStats();
    }
  }, [session?.user?.id]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/estatisticas/manutencao');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
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
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Próximas Manutenções
          </CardTitle>
          <Calendar className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.proximasManutencoes}</div>
          <p className="text-xs text-gray-600 mt-1">
            Agendadas para os próximos 7 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Manutenções Pendentes
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.manutencoesPendentes}</div>
          <p className="text-xs text-gray-600 mt-1">
            Manutenções vencidas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Manutenções Realizadas
          </CardTitle>
          <CheckCircle className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.manutencoesRealizadas}</div>
          <p className="text-xs text-gray-600 mt-1">
            Total de manutenções concluídas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Tickets Abertos
          </CardTitle>
          <Clock className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.ticketsAbertos}</div>
          <p className="text-xs text-gray-600 mt-1">
            Tickets de manutenção em andamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}