'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Clock,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  Search,
  CalendarClock,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TecnicoLayout } from '@/components/tecnico/TecnicoLayout';
import { db } from '@/lib/db/supabase';
import type { Ticket } from '@/types';
import { toast } from 'sonner';

export default function TecnicoTicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadTickets = useCallback(async () => {
    try {
      if (session?.user?.id) {
        const token = (session as any)?.accessToken;
        const data = await db.getTicketsByTecnico(session.user.id, token);
        setTickets(data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.type !== 'tecnico') {
      router.push('/');
      return;
    }

    loadTickets();
  }, [session, status, router, loadTickets]);

  // Heartbeat otimizado para manter status online
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== 'tecnico') return;

    let heartbeatCount = 0;
    const heartbeat = async () => {
      try {
        const token = (session as any)?.accessToken;
        await db.updateTecnicoOnlineStatus(session.user.id, true, token);
        heartbeatCount++;

        // Log apenas ocasionalmente para reduzir spam
        if (heartbeatCount % 5 === 0) {
          console.log(`Tickets page heartbeat #${heartbeatCount}`);
        }
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    };

    // Heartbeat a cada 2 minutos (reduzido de 30s)
    const interval = setInterval(heartbeat, 120000);

    return () => {
      clearInterval(interval);
    };
  }, [session?.user?.id, session?.user?.type]);

  const handleStartTicket = async (ticketId: string) => {
    try {
      const token = (session as any)?.accessToken;
      await db.updateTicket(ticketId, { status: 'em_curso' }, token);

      // Marcar técnico como indisponível quando inicia um ticket
      if (session?.user?.id) {
        await db.updateTecnico(session.user.id, { disponibilidade: false }, token);
      }

      toast.success('Ticket iniciado com sucesso!');
      loadTickets();
    } catch (error) {
      console.error('Error starting ticket:', error);
      toast.error('Erro ao iniciar ticket');
    }
  };

  const handleCancelTicket = async () => {
    if (!selectedTicket || !cancelReason.trim()) {
      toast.error('Por favor, informe o motivo do cancelamento');
      return;
    }

    try {
      const token = (session as any)?.accessToken;
      await db.updateTicket(selectedTicket.id, {
        status: 'cancelado',
        motivo_cancelamento: cancelReason.trim()
      }, token);
      toast.success('Ticket cancelado com sucesso!');
      setShowCancelDialog(false);
      setSelectedTicket(null);
      setCancelReason('');
      loadTickets();
    } catch (error) {
      console.error('Error canceling ticket:', error);
      toast.error('Erro ao cancelar ticket');
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
      case 'cancelado':
        return 'bg-red-100 text-red-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4" />;
      case 'em_curso':
        return <PlayCircle className="h-4 w-4" />;
      case 'finalizado':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.prioridade === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <TecnicoLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Meus Tickets</h1>
          <Button onClick={loadTickets} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por título ou cliente..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_curso">Em curso</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={priorityFilter}
              onValueChange={setPriorityFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Tickets */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-slate-300">Carregando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-slate-300">Nenhum ticket encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-grow space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h3 className="font-semibold text-lg text-white">{ticket.titulo}</h3>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(ticket.status)}
                              {ticket.status === 'pendente' ? 'Pendente' :
                                ticket.status === 'em_curso' ? 'Em Curso' :
                                  ticket.status === 'finalizado' ? 'Finalizado' : 'Cancelado'}
                            </span>
                          </Badge>
                          <Badge className={getPriorityColor(ticket.prioridade)}>
                            <span className="flex items-center gap-1">
                              {getPriorityIcon(ticket.prioridade)}
                              {ticket.prioridade.charAt(0).toUpperCase() + ticket.prioridade.slice(1)}
                            </span>
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm text-slate-300">
                        Cliente: <span className="font-medium text-slate-200">{ticket.cliente?.nome}</span>
                      </div>

                      <div className="text-sm text-slate-300 flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Criado em: {formatDate(ticket.created_at)}
                      </div>

                      {/* Motivo do cancelamento */}
                      {ticket.status === 'cancelado' && ticket.motivo_cancelamento && (
                        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-red-300">Motivo do cancelamento:</p>
                            <p className="text-red-200 mt-1">{ticket.motivo_cancelamento}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      {ticket.status === 'pendente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartTicket(ticket.id)}
                        >
                          <PlayCircle className="mr-1.5 h-4 w-4" />
                          Iniciar
                        </Button>
                      )}

                      {ticket.status === 'em_curso' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowCancelDialog(true);
                          }}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Cancelar
                        </Button>
                      )}

                      {ticket.status === 'cancelado' && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Info className="h-4 w-4" />
                          <span>Aguardando reativação pelo admin</span>
                        </div>
                      )}

                      {ticket.status === 'finalizado' ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(`/tecnico/ticket/${ticket.id}/view`)}
                        >
                          <FileText className="mr-1.5 h-4 w-4" />
                          Ver Relatório
                        </Button>
                      ) : ticket.status !== 'cancelado' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(`/tecnico/ticket/${ticket.id}`)}
                        >
                          <FileText className="mr-1.5 h-4 w-4" />
                          {ticket.status === 'em_curso' ? 'Continuar' : 'Ver Detalhes'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Cancelamento */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Cancelar Ticket
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-300">Atenção!</p>
                    <p className="text-yellow-200 mt-1">
                      Ao cancelar este ticket, ele será enviado para revisão do administrador.
                      O ticket só poderá ser reativado após aprovação.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Motivo do cancelamento *
                </label>
                <Textarea
                  placeholder="Descreva o motivo do cancelamento..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setSelectedTicket(null);
                  setCancelReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelTicket}
                disabled={!cancelReason.trim()}
              >
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TecnicoLayout>
  );
}
