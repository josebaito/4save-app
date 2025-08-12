'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import type { HistoricoManutencao, Ticket } from '@/types';

export function HistoricoManutencao() {
  const { data: session } = useSession();
  const [historico, setHistorico] = useState<HistoricoManutencao[]>([]);
  const [ticketsFinalizados, setTicketsFinalizados] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session?.user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar tickets finalizados do técnico
      const ticketsData = await db.getTicketsByTecnico(session!.user!.id);
      const ticketsManutencaoFinalizados = ticketsData.filter(t => 
        t.tipo === 'manutencao' && t.status === 'finalizado'
      );
      setTicketsFinalizados(ticketsManutencaoFinalizados);
      
      // Carregar histórico de manutenção
      // Idealmente, filtrar apenas o histórico relevante para este técnico
      // Como não temos um campo técnico_id na tabela de histórico, vamos usar os tickets finalizados
      // para buscar o histórico correspondente
      const historicoData: HistoricoManutencao[] = [];
      
      for (const ticket of ticketsManutencaoFinalizados) {
        try {
          // Buscar histórico pelo ticket_id
          const historicoTicket = await db.getHistoricoManutencao();
          const filtrado = historicoTicket.filter(h => h.ticket_id === ticket.id);
          historicoData.push(...filtrado);
        } catch (e) {
          console.error('Erro ao buscar histórico para ticket:', e);
        }
      }
      
      setHistorico(historicoData);
    } catch (error) {
      console.error('Erro ao carregar histórico de manutenção:', error);
      toast.error('Erro ao carregar histórico de manutenção');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    try {
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Histórico de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Histórico de Manutenção
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historico.length === 0 && ticketsFinalizados.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhum registro de manutenção encontrado.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Exibir histórico de manutenção */}
            {historico.map((registro) => (
              <div 
                key={registro.id} 
                className="p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {registro.contrato?.descricao || `Contrato #${registro.contrato_id.substring(0, 8)}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Cliente: {registro.contrato?.cliente?.nome || 'N/A'}
                    </p>
                  </div>
                  <Badge className={`${registro.tipo_manutencao === 'preventiva' ? 'bg-blue-100 text-blue-800' : registro.tipo_manutencao === 'corretiva' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                    {registro.tipo_manutencao}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4">
                  {registro.data_realizada && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Realizada: {formatarData(registro.data_realizada)}
                      </span>
                    </div>
                  )}
                  {registro.data_agendada && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Agendada: {formatarData(registro.data_agendada)}
                      </span>
                    </div>
                  )}
                </div>
                {registro.observacoes && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{registro.observacoes}</p>
                  </div>
                )}
                {registro.ticket_id && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full flex items-center gap-2"
                      onClick={() => window.location.href = `/tecnico/ticket/${registro.ticket_id}`}
                    >
                      <FileText className="h-4 w-4" />
                      Ver Ticket
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Exibir tickets finalizados que não têm histórico */}
            {ticketsFinalizados
              .filter(ticket => !historico.some(h => h.ticket_id === ticket.id))
              .map(ticket => (
                <div 
                  key={ticket.id} 
                  className="p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{ticket.titulo}</h3>
                      <p className="text-sm text-gray-600">
                        Cliente: {ticket.cliente?.nome || 'N/A'}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Finalizado
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{ticket.descricao}</p>
                  </div>
                  {ticket.updated_at && (
                    <div className="mt-2 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Finalizado: {formatarData(ticket.updated_at)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full flex items-center gap-2"
                      onClick={() => window.location.href = `/tecnico/ticket/${ticket.id}`}
                    >
                      <FileText className="h-4 w-4" />
                      Ver Ticket
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}