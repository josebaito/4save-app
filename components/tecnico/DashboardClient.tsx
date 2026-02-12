'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { useOptimizedTecnicoDashboard } from '@/lib/hooks/useOptimizedTecnicoDashboard';
import { toast } from 'sonner';
import type { Ticket } from '@/types';

interface DashboardClientProps {
    initialTickets?: Ticket[];
}

export function DashboardClient({ initialTickets = [] }: DashboardClientProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Initialize with server data if available, otherwise fetch
    const { tickets, loading, lastTicketCount, loadTickets, invalidateCache } = useOptimizedTecnicoDashboard(initialTickets);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session || session.user?.type !== 'tecnico') {
            router.push('/');
            return;
        }
    }, [session, status, router]);

    // Verificar novos tickets
    useEffect(() => {
        // Only notify if we have a valid previous count and it increased
        // We skip the initial load check to avoid notifying for existing tickets on refresh
        if (lastTicketCount > 0 && tickets.length > lastTicketCount) {
            const novosTickets = tickets.length - lastTicketCount;
            toast.success(`🎉 ${novosTickets} novo(s) ticket(s) atribuído(s) a você!`);
        }
    }, [tickets.length, lastTicketCount]);

    // Sincronizar disponibilidade quando técnico faz login
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.type === 'tecnico') {
            fetch('/api/sync-disponibilidade', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('✅ Disponibilidade sincronizada');
                        // ✅ NOVO: Forçar reload dos tickets após sincronização
                        invalidateCache();
                        loadTickets();
                    }
                })
                .catch(error => {
                    console.error('❌ Erro ao sincronizar disponibilidade:', error);
                });
        }
    }, [status, session?.user?.type, invalidateCache, loadTickets]);

    const handleStartTicket = async (ticketId: string) => {
        try {
            const token = (session as any)?.accessToken;
            if (!token) {
                toast.error('Sessão inválida. Faça login novamente.');
                return;
            }
            await db.updateTicket(ticketId, { status: 'em_curso' }, token);

            // Marcar técnico como indisponível quando inicia um ticket
            if (session?.user?.id) {
                await db.updateTecnico(session.user.id, { disponibilidade: false }, token);
            }

            toast.success('Ticket iniciado com sucesso!');

            // Invalidar cache e recarregar
            invalidateCache();
            loadTickets();
        } catch (error) {
            console.error('Error starting ticket:', error);
            toast.error('Erro ao iniciar ticket');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente': return 'bg-yellow-100 text-yellow-800';
            case 'em_curso': return 'bg-blue-100 text-blue-800';
            case 'finalizado': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgente': return 'bg-red-100 text-red-800';
            case 'alta': return 'bg-orange-100 text-orange-800';
            case 'media': return 'bg-yellow-100 text-yellow-800';
            case 'baixa': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
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

    if (loading && tickets.length === 0) {
        return (
            <TecnicoLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                        <p className="mt-2 text-slate-400">Carregando tickets...</p>
                    </div>
                </div>
            </TecnicoLayout>
        );
    }

    const ticketsPendentes = tickets.filter(t => t.status === 'pendente');
    const ticketsEmCurso = tickets.filter(t => t.status === 'em_curso');
    const ticketsFinalizados = tickets.filter(t => t.status === 'finalizado');
    const ticketsCancelados = tickets.filter(t => t.status === 'cancelado');

    return (
        <TecnicoLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Meus Tickets</h1>
                    <p className="text-slate-400">Gerencie seus atendimentos técnicos</p>
                </div>

                <NotificacoesManutencao />

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white/10 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:bg-white/15">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">
                                Pendentes
                            </CardTitle>
                            <Clock className="h-5 w-5 text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{ticketsPendentes.length}</div>
                            <p className="text-xs text-slate-300 mt-1">
                                Aguardando início
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/10 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:bg-white/15">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">
                                Em Curso
                            </CardTitle>
                            <PlayCircle className="h-5 w-5 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{ticketsEmCurso.length}</div>
                            <p className="text-xs text-slate-300 mt-1">
                                Em atendimento
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/10 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:bg-white/15">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">
                                Finalizados
                            </CardTitle>
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{ticketsFinalizados.length}</div>
                            <p className="text-xs text-slate-300 mt-1">
                                Concluídos
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tickets Em Curso */}
                {ticketsEmCurso.length > 0 && (
                    <Card className="bg-white/10 border-white/20 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <PlayCircle className="h-5 w-5 text-blue-400" />
                                Tickets em Andamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ticketsEmCurso.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between p-4 bg-blue-500/20 rounded-xl border border-blue-500/30"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getPriorityIcon(ticket.prioridade)}
                                                <h4 className="font-semibold text-white">{ticket.titulo}</h4>
                                            </div>
                                            <p className="text-sm text-slate-300 mb-1">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            <p className="text-xs text-slate-400">
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

                {/* Tickets Cancelados */}
                {ticketsCancelados.length > 0 && (
                    <Card className="bg-white/10 border-white/20 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                Tickets Cancelados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ticketsCancelados.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between p-4 bg-red-500/20 rounded-xl border border-red-500/30"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-white">{ticket.titulo}</h4>
                                                <Badge className="bg-red-100 text-red-800">
                                                    Cancelado
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-300 mb-1">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            {ticket.motivo_cancelamento && (
                                                <p className="text-xs text-red-300">
                                                    Motivo: {ticket.motivo_cancelamento}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                Aguardando reativação pelo admin
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tickets Pendentes */}
                <Card className="bg-white/10 border-white/20 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <FileText className="h-5 w-5 text-slate-300" />
                            Tickets Disponíveis ({ticketsPendentes.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ticketsPendentes.length > 0 ? (
                            <div className="space-y-4">
                                {ticketsPendentes.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getPriorityIcon(ticket.prioridade)}
                                                <h4 className="font-semibold text-white">{ticket.titulo}</h4>
                                            </div>
                                            <p className="text-sm text-slate-300 mb-1">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            <p className="text-sm text-slate-400 mb-1">
                                                {ticket.descricao}
                                            </p>
                                            <p className="text-xs text-slate-400">
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
                                                className="flex items-center gap-2 text-slate-200 border-slate-400 hover:bg-slate-600"
                                            >
                                                <PlayCircle className="h-4 w-4" />
                                                Iniciar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                                <p className="text-slate-300">Nenhum ticket pendente</p>
                                <p className="text-sm mt-1 text-slate-400">
                                    Todos os tickets foram atendidos
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tickets Finalizados */}
                {ticketsFinalizados.length > 0 && (
                    <Card className="bg-white/10 border-white/20 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                Tickets Finalizados Recentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ticketsFinalizados.slice(0, 3).map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between p-4 bg-green-500/20 rounded-xl border border-green-500/30"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{ticket.titulo}</h4>
                                            <p className="text-sm text-slate-300">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Finalizado em: {new Date(ticket.updated_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-500/30 text-green-200 border-green-500/40">
                                                Finalizado
                                            </Badge>
                                            <Button
                                                onClick={() => router.push(`/tecnico/ticket/${ticket.id}/view`)}
                                                className="bg-slate-600 text-white hover:bg-slate-500"
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
