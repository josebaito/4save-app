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
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'em_curso':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'finalizado':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'cancelado':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'alta':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
      case 'media':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'baixa':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground border border-border';
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
        <div className="flex justify-between items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Meus Tickets</h1>
          <Button onClick={loadTickets} variant="outline" className="gap-2 h-10 shrink-0">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3">
          <div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
            <p className="text-muted-foreground">Carregando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-muted-foreground">Nenhum ticket encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden border-border">
                <CardContent className="p-0">
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex-grow space-y-2">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-base sm:text-lg text-foreground">{ticket.titulo}</h3>
                        <div className="flex flex-wrap gap-2">
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

                      <div className="text-sm text-muted-foreground">
                        Cliente: <span className="font-medium text-foreground/80">{ticket.cliente?.nome}</span>
                      </div>

                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Criado em: {formatDate(ticket.created_at)}
                      </div>

                      {/* Motivo do cancelamento */}
                      {ticket.status === 'cancelado' && ticket.motivo_cancelamento && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-red-500 dark:text-red-400">Motivo do cancelamento:</p>
                            <p className="text-red-500/80 dark:text-red-300 mt-1">{ticket.motivo_cancelamento}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      {ticket.status === 'pendente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 min-w-[80px]"
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
                          className="h-10 min-w-[90px]"
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Info className="h-4 w-4 shrink-0" />
                          <span>Aguardando reativação pelo admin</span>
                        </div>
                      )}

                      {ticket.status === 'finalizado' ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-10 min-w-[110px]"
                          onClick={() => router.push(`/tecnico/ticket/${ticket.id}/view`)}
                        >
                          <FileText className="mr-1.5 h-4 w-4" />
                          Ver Relatório
                        </Button>
                      ) : ticket.status !== 'cancelado' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-10 min-w-[100px]"
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
          <DialogContent className="sm:max-w-[500px] max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Cancelar Ticket
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">Atenção!</p>
                    <p className="text-amber-600/80 dark:text-amber-300 mt-1">
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
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pb-1">
              <Button
                variant="outline"
                className="h-11 w-full sm:w-auto"
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
                className="h-11 w-full sm:w-auto"
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
