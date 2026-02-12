'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Clock, CheckCircle } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/lib/db/supabase';
// import { createSupabaseClient } from '@/lib/db/supabase';

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

        // Carregar apenas tickets de notificação (tabela notificacoes não existe)
        const session: any = await import('next-auth/react').then(mod => mod.getSession());
        const token = session?.accessToken;
        const tickets = await db.getTickets(token);
        const notificacaoTickets = tickets.filter(t => t.tipo === 'manutencao' && t.status === 'pendente');
        setTicketsNotificacao(notificacaoTickets);

        // Limpar notificações da tabela inexistente
        setNotificacoes([]);

      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarNotificacoes();
  }, []);

  const marcarComoLida = async () => {
    // Função desabilitada - tabela notificacoes não existe
    console.log('Função marcarComoLida desabilitada - tabela notificacoes não existe');
  };

  const marcarTicketComoLido = async (id: string) => {
    try {
      const session: any = await import('next-auth/react').then(mod => mod.getSession());
      const token = session?.accessToken;
      if (!token) {
        console.error('Sem sessão: não foi possível marcar ticket como lido');
        return;
      }
      await db.updateTicket(id, { status: 'finalizado' }, token);
      setTicketsNotificacao(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao marcar ticket como lido:', error);
    }
  };

  const formatarData = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dataString;
    }
  };

  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-900/30 text-red-300 border-red-500/50';
      case 'media':
        return 'bg-amber-900/30 text-amber-300 border-amber-500/50';
      default:
        return 'bg-blue-900/30 text-blue-300 border-blue-500/50';
    }
  };

  const isProxima = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      const hoje = new Date();
      const limiteFuturo = addDays(hoje, 3);
      return isAfter(data, hoje) && isBefore(data, limiteFuturo);
    } catch {
      return false;
    }
  };

  const temNotificacoes = notificacoes.length > 0 || ticketsNotificacao.length > 0;

  if (loading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-blue-400" />
            Notificações de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-400">
            Carregando notificações...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!temNotificacoes) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-blue-400" />
            Notificações de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-400">
            Não há notificações de manutenção pendentes.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="h-5 w-5 text-blue-400" />
          Notificações de Manutenção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notificações da tabela de notificações */}
        {notificacoes.map((notificacao) => (
          <div
            key={notificacao.id}
            className={`p-3 border rounded-lg ${isProxima(notificacao.data_programada) ? 'bg-amber-500/20 border-amber-500/30' : 'bg-white/5 border-white/10'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-white">{notificacao.titulo}</h4>
              <Badge className={getCorPrioridade(notificacao.prioridade)}>
                {notificacao.prioridade}
              </Badge>
            </div>
            <p className="text-sm text-slate-300 mb-2">{notificacao.mensagem}</p>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatarData(notificacao.data_programada)}
              </div>
              <button
                onClick={() => marcarComoLida()}
                className="flex items-center gap-1 text-green-400 hover:text-green-300"
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
            className="p-3 border rounded-lg bg-blue-500/20 border-blue-500/30"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-white">{ticket.titulo}</h4>
              <Badge className={getCorPrioridade(ticket.prioridade)}>
                {ticket.prioridade}
              </Badge>
            </div>
            <p className="text-sm text-slate-300 mb-2">{ticket.descricao}</p>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ticket.cliente?.nome || 'Cliente'} - {ticket.contrato?.numero || 'Contrato'}
              </div>
              <button
                onClick={() => marcarTicketComoLido(ticket.id)}
                className="flex items-center gap-1 text-green-400 hover:text-green-300"
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