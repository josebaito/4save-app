'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Clock, CheckCircle } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/lib/db/supabase';
import { createSupabaseClient } from '@/lib/db/supabase';

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  data_programada: string;
  contrato_id: string;
  cliente_id: string;
  lida: boolean;
  prioridade: string;
  created_at: string;
}

interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  created_at: string;
  contrato_id: string;
  cliente_id: string;
  contrato?: {
    numero: string;
  };
  cliente?: {
    nome: string;
  };
}

export function NotificacoesManutencao() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [ticketsNotificacao, setTicketsNotificacao] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarNotificacoes = async () => {
      try {
        setLoading(true);
        
        // Tentar carregar da tabela de notificações
        try {
          const supabase = createSupabaseClient();
          const { data, error } = await supabase
            .from('notificacoes')
            .select('*')
            .eq('tipo', 'manutencao_programada')
            .eq('lida', false)
            .order('created_at', { ascending: false });
          
          if (!error) {
            setNotificacoes(data || []);
          }
        } catch (e) {
          console.log('Tabela de notificações não encontrada, buscando tickets de notificação');
        }
        
        // Carregar tickets de notificação (alternativa)
        const tickets = await db.getTickets();
        const notificacaoTickets = tickets.filter(t => t.tipo === 'manutencao' && t.status === 'pendente');
        setTicketsNotificacao(notificacaoTickets);
        
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarNotificacoes();
  }, []);

  const marcarComoLida = async (id: string) => {
    try {
      const supabase = createSupabaseClient();
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);
      
      setNotificacoes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTicketComoLido = async (id: string) => {
    try {
      await db.updateTicket(id, { status: 'finalizado' });
      setTicketsNotificacao(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao marcar ticket como lido:', error);
    }
  };

  const formatarData = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return dataString;
    }
  };

  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const isProxima = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      const hoje = new Date();
      const limiteFuturo = addDays(hoje, 3);
      return isAfter(data, hoje) && isBefore(data, limiteFuturo);
    } catch (e) {
      return false;
    }
  };

  const temNotificacoes = notificacoes.length > 0 || ticketsNotificacao.length > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notificações de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Carregando notificações...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!temNotificacoes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notificações de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Não há notificações de manutenção pendentes.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Notificações de Manutenção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notificações da tabela de notificações */}
        {notificacoes.map((notificacao) => (
          <div 
            key={notificacao.id} 
            className={`p-3 border rounded-lg ${isProxima(notificacao.data_programada) ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{notificacao.titulo}</h4>
              <Badge className={getCorPrioridade(notificacao.prioridade)}>
                {notificacao.prioridade}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{notificacao.mensagem}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatarData(notificacao.data_programada)}
              </div>
              <button 
                onClick={() => marcarComoLida(notificacao.id)}
                className="flex items-center gap-1 text-green-600 hover:text-green-800"
              >
                <CheckCircle className="h-3 w-3" />
                Marcar como lida
              </button>
            </div>
          </div>
        ))}

        {/* Tickets de notificação (alternativa) */}
        {ticketsNotificacao.map((ticket) => (
          <div 
            key={ticket.id} 
            className="p-3 border rounded-lg bg-blue-50 border-blue-200"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{ticket.titulo}</h4>
              <Badge className={getCorPrioridade(ticket.prioridade)}>
                {ticket.prioridade}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{ticket.descricao}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ticket.cliente?.nome || 'Cliente'} - {ticket.contrato?.numero || 'Contrato'}
              </div>
              <button 
                onClick={() => marcarTicketComoLido(ticket.id)}
                className="flex items-center gap-1 text-green-600 hover:text-green-800"
              >
                <CheckCircle className="h-3 w-3" />
                Marcar como lido
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}