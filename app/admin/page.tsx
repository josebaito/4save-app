'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  Wrench, 
  CheckCircle, 
  Clock,
  TrendingUp,
  PlayCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OnlineStatusCard } from '@/components/admin/OnlineStatusCard';
import { useOptimizedAdminDashboard } from '@/lib/hooks/useOptimizedAdminDashboard';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Usar hook otimizado
  const { 
    stats, 
    recentTickets, 
    loading, 
    notifications, 
    tecnicosOnline, 
    ticketsEmExecucao, 
    refresh: loadDashboardData 
  } = useOptimizedAdminDashboard();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.type !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Mostrar notificações como toast
  useEffect(() => {
    notifications.forEach(notification => {
      toast(notification, {
        duration: 5000,
        icon: '🔔'
      });
    });
  }, [notifications]);


  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-slate-400">Carregando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Visão geral do sistema</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              🔄 Atualizar
            </Button>
          </div>
        </div>

        {/* Notificações */}
        {notifications.length > 0 && (
          <Card className="border-orange-500/20 bg-orange-500/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400">
                🔔 Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={index} className="text-sm text-orange-300">
                    {notification}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl hover:shadow-2xl transition-all hover:bg-slate-800/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total de Clientes
                </CardTitle>
                <Users className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.total_clientes}</div>
                <p className="text-xs text-slate-400 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Clientes ativos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl hover:shadow-2xl transition-all hover:bg-slate-800/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Tickets Pendentes
                </CardTitle>
                <Clock className="h-5 w-5 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.tickets_pendentes}</div>
                <p className="text-xs text-slate-400 mt-1">
                  <FileText className="h-3 w-3 inline mr-1" />
                  Aguardando atendimento
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl hover:shadow-2xl transition-all hover:bg-slate-800/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Técnicos Ativos
                </CardTitle>
                <Wrench className="h-5 w-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.tecnicos_ativos}</div>
                <p className="text-xs text-slate-400 mt-1">
                  <Users className="h-3 w-3 inline mr-1" />
                  Técnicos disponíveis
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl hover:shadow-2xl transition-all hover:bg-slate-800/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Finalizados (Mês)
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.tickets_finalizados_mes}</div>
                <p className="text-xs text-slate-400 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Tickets concluídos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monitoramento em Tempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Online */}
          <OnlineStatusCard refreshInterval={30000} />

          {/* Técnicos Online */}
          <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-green-400" />
                Técnicos Online ({tecnicosOnline.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tecnicosOnline.length > 0 ? (
                <div className="space-y-3">
                  {tecnicosOnline.map((tecnico) => (
                    <div key={tecnico.id} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div>
                        <h4 className="font-medium text-white">{tecnico.name}</h4>
                        <p className="text-sm text-slate-400">{tecnico.especialidade || 'Geral'}</p>
                        {tecnico.last_seen && (
                          <p className="text-xs text-slate-500">
                            Ativo há {Math.round((Date.now() - new Date(tecnico.last_seen).getTime()) / 60000)}min
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Online</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">Nenhum técnico online</p>
                  <p className="text-sm mt-1 text-slate-500">Técnicos aparecem aqui quando estão usando a aplicação</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets em Execução */}
          <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <PlayCircle className="h-5 w-5 text-blue-400" />
                Tickets em Execução ({ticketsEmExecucao.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsEmExecucao.length > 0 ? (
                <div className="space-y-3">
                  {ticketsEmExecucao.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{ticket.titulo}</h4>
                        <p className="text-sm text-slate-400">
                          {ticket.tecnico?.name || 'Sem técnico'}
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {ticket.prioridade}
                      </Badge>
                    </div>
                  ))}
                  {ticketsEmExecucao.length > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      +{ticketsEmExecucao.length - 5} mais em execução
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <PlayCircle className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">Nenhum ticket em execução</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card className="bg-slate-800/50 border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-slate-400" />
              Tickets Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{ticket.titulo}</h4>
                      <p className="text-sm text-slate-400 mt-1">
                        Cliente: {ticket.cliente?.nome}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        {ticket.prioridade}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">Nenhum ticket encontrado</p>
                <p className="text-sm mt-1 text-slate-500">
                  Crie tickets para ver dados aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 