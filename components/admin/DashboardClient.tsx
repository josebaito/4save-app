'use client';

import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    FileText,
    Wrench,
    CheckCircle,
    Clock,
    TrendingUp,
    PlayCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { MotionCard, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/motion-card';
import { TicketsTrendChart } from '@/components/admin/TicketsTrendChart';
import { useOptimizedAdminDashboard } from '@/lib/hooks/useOptimizedAdminDashboard';
import { toast } from 'sonner';

import { DashboardStats, Ticket, User } from '@/types';

interface DashboardClientProps {
    initialStats?: DashboardStats | null;
    initialTickets?: Ticket[];
    initialTecnicosOnline?: User[];
}

export function DashboardClient({
    initialStats = null,
    initialTickets = [],
    initialTecnicosOnline = []
}: DashboardClientProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Usar hook otimizado com dados iniciais
    const {
        stats,
        recentTickets,
        loading,
        notifications,
        tecnicosOnline,
        ticketsEmExecucao,
        refresh: loadDashboardData
    } = useOptimizedAdminDashboard({
        initialStats,
        initialTickets,
        initialTecnicosOnline
    });

    useEffect(() => {
        if (status === 'loading') return;

        if (!session || session.user?.type !== 'admin') {
            router.push('/');
            return;
        }
    }, [session, status, router]);

    // Mostrar notificações como toast
    useEffect(() => {
        notifications.forEach(notification => {
            toast(notification, {
                duration: 5000,
                icon: '🔔'
            });
        });
    }, [notifications]);

    // Apenas os últimos N registos para o bloco "Recent Activity Log"
    const RECENT_ACTIVITY_LIMIT = 5;
    const latestActivityTickets = useMemo(() => {
        return [...recentTickets]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, RECENT_ACTIVITY_LIMIT);
    }, [recentTickets]);

    const handleSyncDisponibilidade = async () => {
        try {
            const response = await fetch('/api/sync-disponibilidade', { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                toast.success('Disponibilidade sincronizada com sucesso!');
                loadDashboardData(); // Recarregar dados
            } else {
                toast.error('Erro ao sincronizar disponibilidade');
            }
        } catch (error) {
            console.error('Erro ao sincronizar disponibilidade:', error);
            toast.error('Erro ao sincronizar disponibilidade');
        }
    };


    if (status === 'loading' || loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                        <p className="mt-2 text-slate-400">Carregando dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

            <div className="space-y-6 relative max-w-7xl mx-auto">
                <DashboardHeader
                    onRefresh={loadDashboardData}
                    onSync={handleSyncDisponibilidade}
                    loading={loading}
                />

                {/* Notificações (Same as before) */}
                {notifications.length > 0 && (
                    <Card className="border-orange-500/20 bg-orange-500/10 backdrop-blur-sm shadow-sm mb-6">
                        <CardHeader className="py-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </span>
                                Notificações do Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className="space-y-1">
                                {notifications.map((notification, index) => (
                                    <div key={index} className="text-sm font-mono text-orange-700 dark:text-orange-300 pl-4 border-l-2 border-orange-500/30">
                                        {notification}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* KPIs (Same as before but wrapped for layout) */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <MotionCard delay={0.1} className="bg-card dark:bg-slate-700/50 border-border shadow-sm hover:shadow-md transition-all group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                                    Total de Clientes
                                </CardTitle>
                                <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-card-foreground font-mono tracking-tight">{stats.total_clientes}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">
                                    Ativos na base
                                </p>
                            </CardContent>
                        </MotionCard>
                        {/* ... (Repeat for other KPIs with updated styles) */}
                        <MotionCard delay={0.2} className="bg-card dark:bg-slate-700/50 border-border shadow-sm hover:shadow-md transition-all group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                                    Tickets Pendentes
                                </CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-card-foreground font-mono tracking-tight">{stats.tickets_pendentes}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">
                                    Aguardando Ação
                                </p>
                            </CardContent>
                        </MotionCard>

                        <MotionCard delay={0.3} className="bg-card dark:bg-slate-700/50 border-border shadow-sm hover:shadow-md transition-all group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                                    Técnicos Ativos
                                </CardTitle>
                                <Wrench className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform duration-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-card-foreground font-mono tracking-tight">{stats.tecnicos_ativos}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">
                                    Disponíveis Agora
                                </p>
                            </CardContent>
                        </MotionCard>

                        <MotionCard delay={0.4} className="bg-card dark:bg-slate-700/50 border-border shadow-sm hover:shadow-md transition-all group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                                    Finalizados (Mês)
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-card-foreground font-mono tracking-tight">{stats.tickets_finalizados_mes}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">
                                    Performance Mensal
                                </p>
                            </CardContent>
                        </MotionCard>
                    </div>
                )}

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-card dark:bg-slate-700/50 border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow p-1">
                        <TicketsTrendChart tickets={recentTickets} />
                    </div>

                    {/* Live Technicians */}
                    <MotionCard delay={0.5} className="bg-card dark:bg-slate-700/50 border-border shadow-sm flex flex-col h-full">
                        <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20">
                            <CardTitle className="flex items-center justify-between text-sm font-medium">
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Live Technicians
                                </span>
                                <Badge variant="outline" className="font-mono text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                                    {tecnicosOnline.length} ONLINE
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto max-h-[300px] p-0">
                            {tecnicosOnline.length > 0 ? (
                                <div className="divide-y divide-border/50">
                                    {tecnicosOnline.map((tecnico) => (
                                        <div key={tecnico.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold ring-2 ring-background">
                                                        {tecnico.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium leading-none">{tecnico.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{tecnico.especialidade || 'Generalista'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                                    <Users className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-xs">Offline Network</p>
                                </div>
                            )}
                        </CardContent>
                    </MotionCard>
                </div>

                {/* Enterprise Data Grid - Recent Tickets */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Recent Activity Log
                        </h3>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/tickets">
                                Ver todos os tickets &rarr;
                            </Link>
                        </Button>
                    </div>

                    <div className="border border-border rounded-xl bg-card dark:bg-slate-700/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left">
                                        <th className="py-3 px-4 font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider w-[100px]">ID</th>
                                        <th className="py-3 px-4 font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</th>
                                        <th className="py-3 px-4 font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                                        <th className="py-3 px-4 font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider w-[140px]">Date</th>
                                        <th className="py-3 px-4 font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider w-[120px]">Priority</th>
                                        <th className="py-3 px-4 font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider w-[140px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {latestActivityTickets.length > 0 ? (
                                        latestActivityTickets.map((ticket) => (
                                            <tr key={ticket.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="py-3 px-4 font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                                    #{ticket.id.toString().slice(0, 6)}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-foreground">
                                                    {ticket.titulo}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {ticket.cliente?.nome}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                                                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={`
                                                        font-mono text-[10px] uppercase tracking-wider border-0
                                                        ${ticket.prioridade === 'alta' ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' :
                                                            ticket.prioridade === 'media' ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' :
                                                                'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'}
                                                    `}>
                                                        {ticket.prioridade}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${ticket.status === 'pendente' ? 'bg-yellow-500' :
                                                            ticket.status === 'em_curso' ? 'bg-blue-500' :
                                                                'bg-green-500'
                                                            }`} />
                                                        <span className="text-xs font-medium text-muted-foreground capitalize">
                                                            {ticket.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                <p>No activity records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
