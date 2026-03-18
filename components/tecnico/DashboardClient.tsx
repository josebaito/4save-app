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
            case 'pendente': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            case 'em_curso': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
            case 'finalizado': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
            default: return 'bg-muted text-muted-foreground border border-border';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgente': return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
            case 'alta': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
            case 'media': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            case 'baixa': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
            default: return 'bg-muted text-muted-foreground border border-border';
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">A carregar tickets...</p>
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
                    <h1 className="text-2xl font-heading font-bold text-foreground">Os Meus Tickets</h1>
                    <p className="text-muted-foreground text-sm">Gerir os seus atendimentos técnicos</p>
                </div>

                <NotificacoesManutencao />

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-border shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pendentes
                            </CardTitle>
                            <Clock className="h-5 w-5 text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{ticketsPendentes.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Aguardando início
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Em Curso
                            </CardTitle>
                            <PlayCircle className="h-5 w-5 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{ticketsEmCurso.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Em atendimento
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Finalizados
                            </CardTitle>
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{ticketsFinalizados.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Concluídos
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tickets Em Curso */}
                {ticketsEmCurso.length > 0 && (
                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <PlayCircle className="h-5 w-5 text-blue-400" />
                                Tickets em Andamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ticketsEmCurso.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-500/8 rounded-lg border border-blue-500/20"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 min-w-0">
                                                {getPriorityIcon(ticket.prioridade)}
                                                <h4 className="font-semibold text-foreground truncate">{ticket.titulo}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                                            <Badge className={getPriorityColor(ticket.prioridade)}>
                                                {ticket.prioridade}
                                            </Badge>
                                            <Button
                                                onClick={() => router.push(`/tecnico/ticket/${ticket.id}`)}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
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
                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                Tickets Cancelados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ticketsCancelados.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between p-4 bg-red-500/8 rounded-lg border border-red-500/20"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-foreground">{ticket.titulo}</h4>
                                                <Badge variant="cancelado">
                                                    Cancelado
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            {ticket.motivo_cancelamento && (
                                                <p className="text-xs text-red-400 dark:text-red-400">
                                                    Motivo: {ticket.motivo_cancelamento}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="warning">
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
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            Tickets Disponíveis ({ticketsPendentes.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ticketsPendentes.length > 0 ? (
                            <div className="space-y-4">
                                {ticketsPendentes.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors border border-border"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 min-w-0">
                                                {getPriorityIcon(ticket.prioridade)}
                                                <h4 className="font-semibold text-foreground truncate">{ticket.titulo}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            <p className="text-sm text-muted-foreground/80 mb-1 break-words">
                                                {ticket.descricao}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Criado em: {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                                            <Badge className={getPriorityColor(ticket.prioridade)}>
                                                {ticket.prioridade}
                                            </Badge>
                                            <Badge className={getStatusColor(ticket.status)}>
                                                {ticket.status}
                                            </Badge>
                                            <Button
                                                onClick={() => handleStartTicket(ticket.id)}
                                                variant="outline"
                                                className="flex items-center gap-2 w-full sm:w-auto"
                                            >
                                                <PlayCircle className="h-4 w-4" />
                                                Iniciar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
                                <p className="text-foreground/70">Nenhum ticket pendente</p>
                                <p className="text-sm mt-1 text-muted-foreground">
                                    Todos os tickets foram atendidos
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tickets Finalizados */}
                {ticketsFinalizados.length > 0 && (
                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                Tickets Finalizados Recentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ticketsFinalizados.slice(0, 3).map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between p-4 bg-emerald-500/8 rounded-lg border border-emerald-500/20"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground">{ticket.titulo}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Cliente: {ticket.cliente?.nome}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Finalizado em: {new Date(ticket.updated_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="finalizado">
                                                Finalizado
                                            </Badge>
                                            <Button
                                                onClick={() => router.push(`/tecnico/ticket/${ticket.id}/view`)}
                                                variant="outline"
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
