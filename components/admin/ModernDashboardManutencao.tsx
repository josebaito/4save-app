'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Settings,
  Activity,
  TrendingUp,
  Wrench,
  User,
  Search
} from 'lucide-react';
import { RelatorioManutencao } from './RelatorioManutencao';
import { Pagination } from '@/components/ui/pagination';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CronogramaManutencao, HistoricoManutencao, Ticket, Contrato, PlanoManutencao } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ModernDashboardManutencao() {
  const { data: session, status } = useSession();
  const [cronogramas, setCronogramas] = useState<CronogramaManutencao[]>([]);
  const [historico, setHistorico] = useState<HistoricoManutencao[]>([]);
  const [ticketsManutencao, setTicketsManutencao] = useState<Ticket[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pageCronogramas, setPageCronogramas] = useState(1);
  const [pageSizeCronogramas, setPageSizeCronogramas] = useState(10);
  const [pageTickets, setPageTickets] = useState(1);
  const [pageSizeTickets, setPageSizeTickets] = useState(10);
  const [stats, setStats] = useState({
    proximasManutencoes: 0,
    manutencoesPendentes: 0,
    manutencoesRealizadas: 0,
    ticketsAbertos: 0
  });

  // Estados para gerenciamento de cronogramas
  const [isCronogramaDialogOpen, setIsCronogramaDialogOpen] = useState(false);
  const [isEditingCronograma, setIsEditingCronograma] = useState(false);
  const [selectedCronograma, setSelectedCronograma] = useState<CronogramaManutencao | null>(null);
  const [cronogramaFormData, setCronogramaFormData] = useState({
    contrato_id: '',
    tipo_manutencao: 'preventiva' as 'preventiva' | 'corretiva' | 'preditiva',
    frequencia: 'mensal' as 'mensal' | 'trimestral' | 'semestral' | 'anual',
    proxima_manutencao: '',
    observacoes: ''
  });

  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.accessToken) {
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    if (!(session as any)?.accessToken) return;

    try {
      setLoading(true);
      const token = (session as any).accessToken;

      // ✅ CORRIGIDO: Verificação automática com proteção contra duplicação
      console.log('🔍 Verificando sistema completo...');
      const resultado = await db.verificarSistemaCompleto();
      if (resultado.ticketsCriados > 0 || resultado.ticketsAtribuidos > 0) {
        console.log(`✅ ${resultado.ticketsCriados} tickets criados, ${resultado.ticketsAtribuidos} tickets atribuídos`);
        if (resultado.tecnicosAtribuidos > 0) {
          console.log(`👤 ${resultado.tecnicosAtribuidos} técnicos atribuídos automaticamente`);
        }
        const mensagem = `${resultado.ticketsCriados} tickets criados, ${resultado.ticketsAtribuidos} tickets atribuídos!`;
        toast.success(mensagem);
      }

      const [cronogramasData, historicoData, ticketsData, contratosData] = await Promise.all([
        db.getCronogramasManutencao(token),
        db.getHistoricoManutencao(token),
        db.getTickets(token),
        db.getContratos(token)
      ]);

      const ticketsManutenção = ticketsData.filter(ticket => ticket.tipo === 'manutencao');

      setCronogramas(cronogramasData);
      setHistorico(historicoData);
      setTicketsManutencao(ticketsManutenção);
      setContratos(contratosData);

      try {
        const response = await fetch('/api/estatisticas/manutencao');
        if (response.ok) {
          const estatisticas = await response.json();
          setStats({
            proximasManutencoes: estatisticas.proximasManutencoes || 0,
            manutencoesPendentes: estatisticas.manutencoesPendentes || 0,
            manutencoesRealizadas: estatisticas.manutencoesRealizadas || 0,
            ticketsAbertos: estatisticas.ticketsAbertos || 0
          });
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de manutenção:', error);
      toast.error('Erro ao carregar dados de manutenção');
    } finally {
      setLoading(false);
    }
  };

  const openCronogramaDialog = (cronograma?: CronogramaManutencao) => {
    if (cronograma) {
      setSelectedCronograma(cronograma);
      setIsEditingCronograma(true);
      setCronogramaFormData({
        contrato_id: cronograma.contrato_id,
        tipo_manutencao: cronograma.tipo_manutencao as 'preventiva' | 'corretiva' | 'preditiva',
        frequencia: cronograma.frequencia as 'mensal' | 'trimestral' | 'semestral' | 'anual',
        proxima_manutencao: cronograma.proxima_manutencao,
        observacoes: ''
      });
    } else {
      setSelectedCronograma(null);
      setIsEditingCronograma(false);
      setCronogramaFormData({
        contrato_id: '',
        tipo_manutencao: 'preventiva',
        frequencia: 'mensal',
        proxima_manutencao: '',
        observacoes: ''
      });
    }
    setIsCronogramaDialogOpen(true);
  };

  const handleSaveCronograma = async () => {
    try {
      if (!cronogramaFormData.contrato_id || !cronogramaFormData.proxima_manutencao) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const plano: PlanoManutencao = {
        tipo_manutencao: cronogramaFormData.tipo_manutencao,
        frequencia: cronogramaFormData.frequencia,
        inicio_manutencao: cronogramaFormData.proxima_manutencao,
        duracao_contrato: 12,
        valor_manutencao: 0,
        observacoes: cronogramaFormData.observacoes
      };

      if (isEditingCronograma && selectedCronograma) {
        await db.atualizarCronogramaManutencao(selectedCronograma.id, {
          tipo_manutencao: cronogramaFormData.tipo_manutencao,
          frequencia: cronogramaFormData.frequencia,
          proxima_manutencao: cronogramaFormData.proxima_manutencao
        }, (session as any)?.accessToken);
        toast.success('Cronograma atualizado com sucesso!');
      } else {
        await db.criarCronogramaManutencao(cronogramaFormData.contrato_id, plano, (session as any)?.accessToken);
        toast.success('Cronograma criado com sucesso!');
      }

      await loadData();
      setIsCronogramaDialogOpen(false);
      setSelectedCronograma(null);
      setIsEditingCronograma(false);
    } catch (error) {
      console.error('Erro ao salvar cronograma:', error);
      toast.error('Erro ao salvar cronograma');
    }
  };

  const handleDeleteCronograma = async (cronogramaId: string) => {
    if (!confirm('Tem certeza que deseja deletar este cronograma?')) {
      return;
    }

    try {
      await db.deletarCronogramaManutencao(cronogramaId, (session as any)?.accessToken);
      toast.success('Cronograma deletado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar cronograma:', error);
      toast.error('Erro ao deletar cronograma');
    }
  };

  const formatarData = (dataString: string) => {
    try {
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  // ✅ NOVO: Função para criar tickets manualmente (admin)
  const handleCriarTicketsManuais = async () => {
    if (!(session as any)?.accessToken) return;

    try {
      console.log('🔧 Criando tickets manualmente...');
      const token = (session as any).accessToken;

      // Buscar todos os cronogramas ativos (não apenas de hoje)
      const cronogramas = await db.getCronogramasManutencao(token);

      let ticketsCriados = 0;

      for (const cronograma of cronogramas) {
        // Verificar se já existe ticket pendente para este contrato
        const tickets = await db.getTickets(token);
        const ticketExistente = tickets.find(t =>
          t.contrato_id === cronograma.contrato_id &&
          t.tipo === 'manutencao' &&
          t.status === 'pendente'
        );

        if (ticketExistente) {
          console.log(`⏭️ Ticket já existe para contrato ${cronograma.contrato_id}`);
          continue;
        }

        // Criar ticket manualmente
        const ticketData = {
          cliente_id: cronograma.contrato?.cliente_id,
          contrato_id: cronograma.contrato_id,
          titulo: `Manutenção ${cronograma.tipo_manutencao} - ${cronograma.contrato?.numero || 'N/A'}`,
          descricao: `Manutenção ${cronograma.tipo_manutencao} agendada para ${cronograma.proxima_manutencao}. Contrato: ${cronograma.contrato?.numero || 'N/A'}`,
          tipo: 'manutencao' as const,
          prioridade: (cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media') as 'alta' | 'media' | 'baixa',
          status: 'pendente' as const
        };

        await db.createTicket(ticketData, token);
        ticketsCriados++;
        console.log(`✅ Ticket criado manualmente para contrato ${cronograma.contrato_id}`);
      }

      if (ticketsCriados > 0) {
        toast.success(`${ticketsCriados} tickets criados manualmente!`);
        await loadData(); // Recarregar dados
      } else {
        toast.info('Nenhum ticket criado. Todos os cronogramas já possuem tickets pendentes.');
      }
    } catch (error) {
      console.error('Erro ao criar tickets manualmente:', error);
      toast.error('Erro ao criar tickets manualmente');
    }
  };


  const isProxima = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      const hoje = new Date();
      return isAfter(data, hoje) && isBefore(data, addDays(hoje, 7));
    } catch {
      return false;
    }
  };

  const isVencida = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      const hoje = new Date();
      return isBefore(data, hoje);
    } catch {
      return false;
    }
  };

  const filteredCronogramas = cronogramas.filter(cronograma => {
    const matchesSearch = cronograma.contrato?.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cronograma.contrato?.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === 'vencida') {
      matchesStatus = isVencida(cronograma.proxima_manutencao);
    } else if (filterStatus === 'proxima') {
      matchesStatus = isProxima(cronograma.proxima_manutencao);
    } else if (filterStatus === 'agendada') {
      matchesStatus = !isVencida(cronograma.proxima_manutencao) && !isProxima(cronograma.proxima_manutencao);
    }

    return matchesSearch && matchesStatus;
  });

  const totalCronogramas = filteredCronogramas.length;
  const paginatedCronogramas = filteredCronogramas.slice(
    (pageCronogramas - 1) * pageSizeCronogramas,
    pageCronogramas * pageSizeCronogramas
  );
  const totalTicketsManutencao = ticketsManutencao.length;
  const paginatedTicketsManutencao = ticketsManutencao.slice(
    (pageTickets - 1) * pageSizeTickets,
    pageTickets * pageSizeTickets
  );

  useEffect(() => {
    setPageCronogramas(1);
  }, [searchTerm, filterStatus]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Manutenção</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando dados de manutenção...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard de Manutenção</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie cronogramas, tickets e acompanhe o progresso das manutenções
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadData} variant="outline" className="h-10 border-border text-muted-foreground hover:bg-accent">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button
            onClick={handleCriarTicketsManuais}
            variant="outline"
            className="h-10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Criar Tickets</span>
          </Button>
          <Button onClick={() => openCronogramaDialog()} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cronograma
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border hover:bg-card/80 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximas Manutenções
            </CardTitle>
            <Calendar className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.proximasManutencoes}</div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Agendadas para os próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:bg-card/80 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Manutenções Pendentes
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.manutencoesPendentes}</div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Manutenções vencidas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:bg-card/80 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Manutenções Realizadas
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.manutencoesRealizadas}</div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Total de manutenções concluídas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:bg-card/80 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tickets Abertos
            </CardTitle>
            <FileText className="h-5 w-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.ticketsAbertos}</div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Tickets de manutenção em andamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por contrato ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-secondary/60 border-input text-foreground">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as manutenções</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
                <SelectItem value="proxima">Próximas (7 dias)</SelectItem>
                <SelectItem value="agendada">Agendadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="cronogramas" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card border-border h-auto">
          <TabsTrigger value="cronogramas" className="data-[state=active]:bg-card data-[state=active]:text-foreground flex-col sm:flex-row gap-1 py-2">
            <Settings className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">Cronogramas</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-card data-[state=active]:text-foreground flex-col sm:flex-row gap-1 py-2">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-card data-[state=active]:text-foreground flex-col sm:flex-row gap-1 py-2">
            <Activity className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="data-[state=active]:bg-card data-[state=active]:text-foreground flex-col sm:flex-row gap-1 py-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">Relatórios</span>
          </TabsTrigger>
        </TabsList>
        {/* Tab de Cronogramas */}
        <TabsContent value="cronogramas" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Cronogramas de Manutenção ({filteredCronogramas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCronogramas.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-lg font-medium">Nenhum cronograma encontrado</p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    {searchTerm || filterStatus !== 'all' ? 'Ajuste os filtros ou' : ''} Crie um novo cronograma para começar
                  </p>
                  <Button onClick={() => openCronogramaDialog()} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cronograma
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedCronogramas.map((cronograma) => (
                    <div
                      key={cronograma.id}
                      className={`p-6 rounded-xl border transition-all hover:bg-secondary/40 ${isVencida(cronograma.proxima_manutencao)
                        ? 'border-red-500/30 bg-red-500/10'
                        : isProxima(cronograma.proxima_manutencao)
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-border bg-secondary/30'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base sm:text-lg">
                            {cronograma.contrato?.descricao || `Contrato #${cronograma.contrato_id.substring(0, 8)}`}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground/80 truncate">
                              {cronograma.contrato?.cliente?.nome || 'Cliente não informado'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="em_curso" className={cronograma.tipo_manutencao === 'corretiva' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25' : cronograma.tipo_manutencao === 'preditiva' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25' : undefined}>
                            {cronograma.tipo_manutencao}
                          </Badge>
                          <Badge variant="muted">
                            {cronograma.frequencia}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground/80">
                            Próxima:
                            <span className={`font-medium ml-1 ${isVencida(cronograma.proxima_manutencao) ? 'text-red-500 dark:text-red-400' :
                              isProxima(cronograma.proxima_manutencao) ? 'text-amber-500 dark:text-amber-400' :
                                'text-foreground/80'
                              }`}>
                              {formatarData(cronograma.proxima_manutencao)}
                            </span>
                          </span>
                        </div>
                        {cronograma.ultima_manutencao && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground/80">
                              Última: {formatarData(cronograma.ultima_manutencao)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {isVencida(cronograma.proxima_manutencao) && (
                            <Badge variant="cancelado" className="text-xs">
                              Vencida
                            </Badge>
                          )}
                          {isProxima(cronograma.proxima_manutencao) && (
                            <Badge variant="pendente" className="text-xs">
                              Próxima
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCronogramaDialog(cronograma)}
                            className="h-9 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCronograma(cronograma.id)}
                            className="h-9 border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Deletar
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                  {totalCronogramas > 0 && (
                    <Pagination
                      page={pageCronogramas}
                      pageSize={pageSizeCronogramas}
                      totalItems={totalCronogramas}
                      onPageChange={setPageCronogramas}
                      onPageSizeChange={(v) => { setPageSizeCronogramas(v); setPageCronogramas(1); }}
                      label="cronogramas"
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Tab de Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Tickets de Manutenção ({ticketsManutencao.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsManutencao.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-lg font-medium">Nenhum ticket de manutenção</p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    Os tickets de manutenção aparecerão aqui quando forem criados
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedTicketsManutencao.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-6 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base sm:text-lg">{ticket.titulo}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground/80 truncate">
                              {ticket.cliente?.nome || 'Cliente não informado'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={ticket.prioridade as 'urgente' | 'alta' | 'media' | 'baixa'}>
                            {ticket.prioridade}
                          </Badge>
                          <Badge variant={ticket.status as 'pendente' | 'em_curso' | 'finalizado' | 'cancelado'}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{ticket.descricao}</p>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground/70" />
                          <span className="text-muted-foreground">
                            Criado: {formatarData(ticket.created_at)}
                          </span>
                        </div>
                        {ticket.tecnico && (
                          <div className="flex items-center gap-1">
                            <Wrench className="h-4 w-4 text-muted-foreground/70" />
                            <span className="text-muted-foreground">
                              Técnico: {ticket.tecnico.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                  {totalTicketsManutencao > 0 && (
                    <Pagination
                      page={pageTickets}
                      pageSize={pageSizeTickets}
                      totalItems={totalTicketsManutencao}
                      onPageChange={setPageTickets}
                      onPageSizeChange={(v) => { setPageSizeTickets(v); setPageTickets(1); }}
                      label="tickets"
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Histórico de Manutenção ({historico.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-lg font-medium">Nenhum histórico encontrado</p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    O histórico de manutenções aparecerá aqui quando forem realizadas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historico.map((registro) => (
                    <div
                      key={registro.id}
                      className="p-6 rounded-xl border border-border bg-secondary/30"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg">
                            {registro.contrato?.descricao || `Contrato #${registro.contrato_id.substring(0, 8)}`}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground/80">
                              {registro.contrato?.cliente?.nome || 'Cliente não informado'}
                            </span>
                          </div>
                        </div>
                        <Badge variant="em_curso" className={registro.tipo_manutencao === 'corretiva' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25' : registro.tipo_manutencao === 'preditiva' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25' : undefined}>
                          {registro.tipo_manutencao}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {registro.data_realizada && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-foreground/80">
                              Realizada: {formatarData(registro.data_realizada)}
                            </span>
                          </div>
                        )}
                        {registro.data_agendada && (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground/80">
                              Agendada: {formatarData(registro.data_agendada)}
                            </span>
                          </div>
                        )}
                      </div>

                      {registro.observacoes && (
                        <div className="mt-4 p-3 bg-secondary/40 rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground">{registro.observacoes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Relatórios */}
        <TabsContent value="relatorios" className="space-y-4">
          <div className="bg-secondary/40 rounded-lg border border-border p-6">
            <RelatorioManutencao />
          </div>
        </TabsContent>
      </Tabs>
      {/* Modal de Cronograma */}
      <Dialog open={isCronogramaDialogOpen} onOpenChange={setIsCronogramaDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85dvh] overflow-y-auto pb-6">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditingCronograma ? 'Editar Cronograma' : 'Criar Novo Cronograma'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contrato_id" className="text-foreground/80">Contrato</Label>
              <Select
                value={cronogramaFormData.contrato_id}
                onValueChange={(value) => setCronogramaFormData({ ...cronogramaFormData, contrato_id: value })}
                disabled={isEditingCronograma}
              >
                <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contratos.map((contrato) => (
                    <SelectItem key={contrato.id} value={contrato.id}>
                      {contrato.numero} - {contrato.descricao} ({contrato.cliente?.nome})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_manutencao" className="text-foreground/80">Tipo de Manutenção</Label>
                <Select
                  value={cronogramaFormData.tipo_manutencao}
                  onValueChange={(value: 'preventiva' | 'corretiva' | 'preditiva') =>
                    setCronogramaFormData({ ...cronogramaFormData, tipo_manutencao: value })
                  }
                >
                  <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                    <SelectItem value="preditiva">Preditiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequencia" className="text-foreground/80">Frequência</Label>
                <Select
                  value={cronogramaFormData.frequencia}
                  onValueChange={(value: 'mensal' | 'trimestral' | 'semestral' | 'anual') =>
                    setCronogramaFormData({ ...cronogramaFormData, frequencia: value })
                  }
                >
                  <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proxima_manutencao" className="text-foreground/80">Próxima Manutenção</Label>
              <Input
                id="proxima_manutencao"
                type="date"
                value={cronogramaFormData.proxima_manutencao}
                onChange={(e) => setCronogramaFormData({ ...cronogramaFormData, proxima_manutencao: e.target.value })}
                className="bg-secondary/60 border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-foreground/80">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre o cronograma..."
                value={cronogramaFormData.observacoes}
                onChange={(e) => setCronogramaFormData({ ...cronogramaFormData, observacoes: e.target.value })}
                rows={3}
                className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="h-11 sm:h-10"
                onClick={() => setIsCronogramaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveCronograma} className="h-11 sm:h-10 bg-primary hover:bg-primary/90 text-primary-foreground">
                {isEditingCronograma ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
