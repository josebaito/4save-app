'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { TecnicoLayout } from '@/components/tecnico/TecnicoLayout';
import { NotificacoesManutencao } from '@/components/tecnico/NotificacoesManutencao';
import { db } from '@/lib/db/supabase';
import type { Ticket } from '@/types';
import { toast } from 'sonner';

export default function TecnicoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTicketCount, setLastTicketCount] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.type !== 'tecnico') {
      router.push('/');
      return;
    }

    loadTickets();
  }, [session, status, router]);

  // Heartbeat para manter status online
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== 'tecnico') return;
    
    const heartbeat = async () => {
      try {
        await db.updateTecnicoOnlineStatus(session.user.id, true);
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    };
    
    // Heartbeat a cada 30 segundos
    const interval = setInterval(heartbeat, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [session?.user?.id]);

  const loadTickets = async () => {
    try {
      if (session?.user?.id) {
        const data = await db.getTicketsByTecnico(session.user.id);
        
        // Verificar se há novos tickets
        if (lastTicketCount > 0 && data.length > lastTicketCount) {
          const novosTickets = data.length - lastTicketCount;
          toast.success(`🎉 ${novosTickets} novo(s) ticket(s) atribuído(s) a você!`);
        }
        
        setTickets(data);
        setLastTicketCount(data.length);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTicket = async (ticketId: string) => {
    try {
      await db.updateTicket(ticketId, { status: 'em_curso' });
      toast.success('Ticket iniciado com sucesso!');
      loadTickets();
    } catch (error) {
      console.error('Error starting ticket:', error);
      toast.error('Erro ao iniciar ticket');
    }
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgente':
      case 'alta':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Função para visualizar relatório
  const handleViewReport = async (ticket: Ticket) => {
    try {
      // Buscar relatório do ticket
      const relatorio = await db.getRelatorioByTicket(ticket.id);
      
      if (!relatorio) {
        toast.error('Relatório não encontrado para este ticket');
        return;
      }

      // Gerar PDF do relatório
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: ticket.id }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Abrir PDF em nova aba
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        const errorText = await response.text();
        console.error('Erro ao gerar PDF:', response.status, errorText);
        toast.error('Erro ao gerar PDF do relatório');
      }
    } catch (error) {
      console.error('Erro ao visualizar relatório:', error);
      toast.error('Erro ao visualizar relatório');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <TecnicoLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando tickets...</p>
          </div>
        </div>
      </TecnicoLayout>
    );
  }

  const ticketsPendentes = tickets.filter(t => t.status === 'pendente');
  const ticketsEmCurso = tickets.filter(t => t.status === 'em_curso');
  const ticketsFinalizados = tickets.filter(t => t.status === 'finalizado');

  return (
    <TecnicoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Tickets</h1>
          <p className="text-gray-600">Gerencie seus atendimentos técnicos</p>
        </div>
        
        {/* MELHORIA: Notificações de Manutenção */}
        <NotificacoesManutencao />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendentes
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{ticketsPendentes.length}</div>
              <p className="text-xs text-gray-600 mt-1">
                Aguardando início
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Em Curso
              </CardTitle>
              <PlayCircle className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{ticketsEmCurso.length}</div>
              <p className="text-xs text-gray-600 mt-1">
                Em atendimento
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Finalizados
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{ticketsFinalizados.length}</div>
              <p className="text-xs text-gray-600 mt-1">
                Concluídos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Em Curso */}
        {ticketsEmCurso.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-blue-600" />
                Tickets em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticketsEmCurso.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityIcon(ticket.prioridade)}
                        <h4 className="font-semibold text-gray-900">{ticket.titulo}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Cliente: {ticket.cliente?.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(ticket.prioridade)}>
                        {ticket.prioridade}
                      </Badge>
                      <Button
                        onClick={() => router.push(`/tecnico/ticket/${ticket.id}`)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets Pendentes */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tickets Disponíveis ({ticketsPendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsPendentes.length > 0 ? (
              <div className="space-y-4">
                {ticketsPendentes.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityIcon(ticket.prioridade)}
                        <h4 className="font-semibold text-gray-900">{ticket.titulo}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Cliente: {ticket.cliente?.nome}
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        {ticket.descricao}
                      </p>
                      <p className="text-xs text-gray-400">
                        Criado em: {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(ticket.prioridade)}>
                        {ticket.prioridade}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Button
                        onClick={() => handleStartTicket(ticket.id)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum ticket pendente</p>
                <p className="text-sm mt-1">
                  Todos os tickets foram atendidos
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets Finalizados */}
        {ticketsFinalizados.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Tickets Finalizados Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticketsFinalizados.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{ticket.titulo}</h4>
                      <p className="text-sm text-gray-600">
                        Cliente: {ticket.cliente?.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        Finalizado em: {new Date(ticket.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        Finalizado
                      </Badge>
                      <Button 
                        onClick={() => router.push(`/tecnico/ticket/${ticket.id}/view`)}
                        className="bg-gray-900 text-white hover:bg-gray-800"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Relatório
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TecnicoLayout>
  );
}