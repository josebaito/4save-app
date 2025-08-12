'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, Calendar as CalendarIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore, addDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import type { Ticket, CronogramaManutencao } from '@/types';

export function CalendarioManutencao() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cronogramas, setCronogramas] = useState<CronogramaManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventDates, setEventDates] = useState<Date[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<{tickets: Ticket[], cronogramas: CronogramaManutencao[]}>({tickets: [], cronogramas: []});

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (date) {
      updateSelectedDateEvents(date);
    }
  }, [date, tickets, cronogramas]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar tickets do técnico
      const ticketsData = await db.getTicketsByTecnico(session!.user!.id);
      const ticketsManutencao = ticketsData.filter(t => t.tipo === 'manutencao');
      setTickets(ticketsManutencao);
      
      // Carregar cronogramas de manutenção
      // Idealmente, filtrar apenas os cronogramas relevantes para este técnico
      const cronogramasData = await db.getCronogramasManutencao();
      setCronogramas(cronogramasData);
      
      // Calcular datas com eventos
      const dates: Date[] = [];
      
      // Adicionar datas de tickets
      ticketsManutencao.forEach(ticket => {
        try {
          const date = parseISO(ticket.created_at);
          dates.push(date);
        } catch (e) {
          console.error('Erro ao processar data de ticket:', e);
        }
      });
      
      // Adicionar datas de cronogramas
      cronogramasData.forEach(cronograma => {
        if (cronograma.proxima_manutencao) {
          try {
            const date = parseISO(cronograma.proxima_manutencao);
            dates.push(date);
          } catch (e) {
            console.error('Erro ao processar data de cronograma:', e);
          }
        }
      });
      
      setEventDates(dates);
      
      // Atualizar eventos para a data selecionada
      if (date) {
        updateSelectedDateEvents(date);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do calendário:', error);
      toast.error('Erro ao carregar dados do calendário');
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedDateEvents = (selectedDate: Date) => {
    // Filtrar tickets para a data selecionada
    const ticketsForDate = tickets.filter(ticket => {
      try {
        const ticketDate = parseISO(ticket.created_at);
        return isSameDay(ticketDate, selectedDate);
      } catch (e) {
        return false;
      }
    });
    
    // Filtrar cronogramas para a data selecionada
    const cronogramasForDate = cronogramas.filter(cronograma => {
      if (!cronograma.proxima_manutencao) return false;
      try {
        const cronogramaDate = parseISO(cronograma.proxima_manutencao);
        return isSameDay(cronogramaDate, selectedDate);
      } catch (e) {
        return false;
      }
    });
    
    setSelectedDateEvents({
      tickets: ticketsForDate,
      cronogramas: cronogramasForDate
    });
  };

  const formatarData = (dataString: string) => {
    try {
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
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

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'urgente':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isProxima = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      const hoje = new Date();
      return isAfter(data, hoje) && isBefore(data, addDays(hoje, 7));
    } catch (e) {
      return false;
    }
  };

  const isVencida = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      const hoje = new Date();
      return isBefore(data, hoje);
    } catch (e) {
      return false;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Calendário de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Carregando calendário...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          Calendário de Manutenção
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendário */}
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border"
              modifiers={{
                event: (date) => eventDates.some(eventDate => isSameDay(eventDate, date)),
                today: (date) => isToday(date)
              }}
              modifiersClassNames={{
                event: 'bg-blue-100 text-blue-900 font-medium',
                today: 'bg-orange-100 text-orange-900 font-medium'
              }}
            />
          </div>
          
          {/* Eventos do dia */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">
              {date ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
            </h3>
            
            {selectedDateEvents.tickets.length === 0 && selectedDateEvents.cronogramas.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum evento para esta data.
              </div>
            ) : (
              <Tabs defaultValue="tickets" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tickets">
                    Tickets ({selectedDateEvents.tickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="cronogramas">
                    Cronogramas ({selectedDateEvents.cronogramas.length})
                  </TabsTrigger>
                </TabsList>
                
                {/* Tab de Tickets */}
                <TabsContent value="tickets" className="space-y-4 mt-4">
                  {selectedDateEvents.tickets.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Nenhum ticket para esta data.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.tickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className="p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{ticket.titulo}</h4>
                              <p className="text-sm text-gray-600">
                                Cliente: {ticket.cliente?.nome || 'N/A'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getPrioridadeColor(ticket.prioridade)}>
                                {ticket.prioridade}
                              </Badge>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 line-clamp-2">{ticket.descricao}</p>
                          </div>
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => window.location.href = `/tecnico/ticket/${ticket.id}`}
                            >
                              Ver Ticket
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                {/* Tab de Cronogramas */}
                <TabsContent value="cronogramas" className="space-y-4 mt-4">
                  {selectedDateEvents.cronogramas.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Nenhum cronograma para esta data.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.cronogramas.map((cronograma) => (
                        <div 
                          key={cronograma.id} 
                          className={`p-3 rounded-lg border ${isVencida(cronograma.proxima_manutencao) ? 'border-red-200 bg-red-50' : isProxima(cronograma.proxima_manutencao) ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">
                                {cronograma.contrato?.descricao || `Contrato #${cronograma.contrato_id.substring(0, 8)}`}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Cliente: {cronograma.contrato?.cliente?.nome || 'N/A'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={`${cronograma.tipo_manutencao === 'preventiva' ? 'bg-blue-100 text-blue-800' : cronograma.tipo_manutencao === 'corretiva' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                                {cronograma.tipo_manutencao}
                              </Badge>
                              <Badge className="bg-gray-100 text-gray-800">
                                {cronograma.frequencia}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                Próxima: <span className={`font-medium ${isVencida(cronograma.proxima_manutencao) ? 'text-red-600' : isProxima(cronograma.proxima_manutencao) ? 'text-yellow-600' : ''}`}>{formatarData(cronograma.proxima_manutencao)}</span>
                              </span>
                            </div>
                            {cronograma.ultima_manutencao && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                  Última: {formatarData(cronograma.ultima_manutencao)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}