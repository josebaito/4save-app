'use client';

import { useEffect, useState } from 'react';
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
  Plus,
  PlayCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OnlineStatusCard } from '@/components/admin/OnlineStatusCard';
import { db } from '@/lib/db/supabase';
import type { DashboardStats, Ticket } from '@/types';
import { toast } from 'sonner';
import { User } from '@/types';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [tecnicosOnline, setTecnicosOnline] = useState<User[]>([]);
  const [ticketsEmExecucao, setTicketsEmExecucao] = useState<Ticket[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.type !== 'admin') {
      router.push('/');
      return;
    }

    loadDashboardData();
  }, [session, status, router]);

  const loadDashboardData = async () => {
    try {
      const [dashboardStats, tickets, tecnicos] = await Promise.all([
        db.getDashboardStats(),
        db.getTickets(),
        db.getTecnicos()
      ]);

      setStats(dashboardStats);
      setRecentTickets(tickets.slice(0, 5));
      
      // Usar nova função para técnicos realmente online
      const tecnicosOnline = await db.getTecnicosOnline();
      setTecnicosOnline(tecnicosOnline);
      
      const ticketsEmCurso = tickets.filter(t => t.status === 'em_curso');
      setTicketsEmExecucao(ticketsEmCurso);
      
      // Verificar notificações
      checkNotifications(tickets);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Verificação periódica de status online
  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        await db.checkAndUpdateOnlineStatus();
        // Recarregar dados apenas se houver mudanças
        const tecnicosOnline = await db.getTecnicosOnline();
        setTecnicosOnline(tecnicosOnline);
      } catch (error) {
        console.error('Erro ao verificar status online:', error);
      }
    };
    
    // Verificar a cada minuto
    const interval = setInterval(checkOnlineStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const checkNotifications = (tickets: Ticket[]) => {
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
    
    // Mostrar notificações como toast
    newNotifications.forEach(notification => {
      toast(notification, {
        duration: 5000,
        icon: '🔔'
      });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_curso':
        return 'bg-blue-100 text-blue-800';
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Visão geral do sistema</p>
          </div>
        </div>

        {/* Notificações */}
        {notifications.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                🔔 Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={index} className="text-sm text-orange-700">
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
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Clientes
                </CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.total_clientes}</div>
                <p className="text-xs text-gray-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Clientes ativos
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tickets Pendentes
                </CardTitle>
                <Clock className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.tickets_pendentes}</div>
                <p className="text-xs text-gray-600 mt-1">
                  <FileText className="h-3 w-3 inline mr-1" />
                  Aguardando atendimento
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Técnicos Ativos
                </CardTitle>
                <Wrench className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.tecnicos_ativos}</div>
                <p className="text-xs text-gray-600 mt-1">
                  <Users className="h-3 w-3 inline mr-1" />
                  Técnicos disponíveis
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Finalizados (Mês)
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.tickets_finalizados_mes}</div>
                <p className="text-xs text-gray-600 mt-1">
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
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Técnicos Online ({tecnicosOnline.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tecnicosOnline.length > 0 ? (
                <div className="space-y-3">
                  {tecnicosOnline.map((tecnico) => (
                    <div key={tecnico.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{tecnico.name}</h4>
                        <p className="text-sm text-gray-600">{tecnico.especialidade || 'Geral'}</p>
                        {tecnico.last_seen && (
                          <p className="text-xs text-gray-500">
                            Ativo há {Math.round((Date.now() - new Date(tecnico.last_seen).getTime()) / 60000)}min
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600">Online</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum técnico online</p>
                  <p className="text-sm mt-1">Técnicos aparecem aqui quando estão usando a aplicação</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets em Execução */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-blue-600" />
                Tickets em Execução ({ticketsEmExecucao.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsEmExecucao.length > 0 ? (
                <div className="space-y-3">
                  {ticketsEmExecucao.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{ticket.titulo}</h4>
                        <p className="text-sm text-gray-600">
                          {ticket.tecnico?.name || 'Sem técnico'}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(ticket.prioridade)}>
                        {ticket.prioridade}
                      </Badge>
                    </div>
                  ))}
                  {ticketsEmExecucao.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{ticketsEmExecucao.length - 5} mais em execução
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PlayCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum ticket em execução</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tickets Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{ticket.titulo}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Cliente: {ticket.cliente?.nome}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(ticket.prioridade)}>
                        {ticket.prioridade}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum ticket encontrado</p>
                <p className="text-sm mt-1">
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