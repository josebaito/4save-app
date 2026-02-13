'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, AlertTriangle, CheckCircle, Calendar as CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { RelatorioManutencao } from './RelatorioManutencao';
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

export function DashboardManutencao() {
  const { data: session } = useSession();
  const [cronogramas, setCronogramas] = useState<CronogramaManutencao[]>([]);
  const [historico, setHistorico] = useState<HistoricoManutencao[]>([]);
  const [ticketsManutencao, setTicketsManutencao] = useState<Ticket[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    proximasManutencoes: 0,
    manutencoesPendentes: 0,
    manutencoesRealizadas: 0,
    ticketsAbertos: 0
  });

  // ✅ NOVO: Estados para gerenciamento de cronogramas
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
    if ((session as any)?.accessToken) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = (session as any)?.accessToken;
      if (!token) return;
      
      // Carregar dados de manuten??oção
      const [cronogramasData, historicoData, ticketsData, contratosData] = await Promise.all([
        db.getCronogramasManutencao(token),
        db.getHistoricoManutencao(token),
        db.getTickets(token),
        db.getContratos(token)
      ]);
      
      // Filtrar tickets de manutenção
      const ticketsManutenção = ticketsData.filter(ticket => ticket.tipo === 'manutencao');
      
      setCronogramas(cronogramasData);
      setHistorico(historicoData);
      setTicketsManutencao(ticketsManutenção);
      setContratos(contratosData);
      
      // Obter estatísticas do novo endpoint de API
      const response = await fetch('/api/estatisticas/manutencao');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
      }
      
      const estatisticas = await response.json();
      
      setStats({
        proximasManutencoes: estatisticas.proximasManutencoes || 0,
        manutencoesPendentes: estatisticas.manutencoesPendentes || 0,
        manutencoesRealizadas: estatisticas.manutencoesRealizadas || 0,
        ticketsAbertos: estatisticas.ticketsAbertos || 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados de manutenção:', error);
      toast.error('Erro ao carregar dados de manutenção');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOVO: Função para abrir modal de criação de cronograma
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

  // ✅ NOVO: Função para salvar cronograma
  const handleSaveCronograma = async () => {
    try {
      const token = (session as any)?.accessToken;
      if (!token) return;
      if (!cronogramaFormData.contrato_id || !cronogramaFormData.proxima_manutencao) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const plano: PlanoManutencao = {
        tipo: cronogramaFormData.tipo_manutencao,
        frequencia: cronogramaFormData.frequencia,
        inicio_manutencao: cronogramaFormData.proxima_manutencao,
        duracao_contrato: 12,
        valor_manutencao: 0,
        observacoes: cronogramaFormData.observacoes
      };

      if (isEditingCronograma && selectedCronograma) {
        // Atualizar cronograma existente
        await db.atualizarCronogramaManutencao(selectedCronograma.id, {
          tipo_manutencao: cronogramaFormData.tipo_manutencao,
          frequencia: cronogramaFormData.frequencia,
          proxima_manutencao: cronogramaFormData.proxima_manutencao
        }, token);
        toast.success('Cronograma atualizado com sucesso!');
      } else {
        // Criar novo cronograma
        await db.criarCronogramaManutencao(cronogramaFormData.contrato_id, plano, token);
        toast.success('Cronograma criado com sucesso!');
      }

      // Recarregar dados e fechar modal
      await loadData();
      setIsCronogramaDialogOpen(false);
      setSelectedCronograma(null);
      setIsEditingCronograma(false);
    } catch (error) {
      console.error('Erro ao salvar cronograma:', error);
      toast.error('Erro ao salvar cronograma');
    }
  };

  // ✅ NOVO: Função para deletar cronograma
  const handleDeleteCronograma = async (cronogramaId: string) => {
    const token = (session as any)?.accessToken;
    if (!token) return;
    if (!confirm('Tem certeza que deseja deletar este cronograma?')) {
      return;
    }

    try {
      await db.deletarCronogramaManutencao(cronogramaId, token);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard de Manutenção</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando dados de manutenção...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Manutenção</h2>
          <p className="text-muted-foreground">
            Gerencie cronogramas, tickets e acompanhe o progresso das manutenções
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openCronogramaDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Cronograma
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Próximas Manutenções
            </CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.proximasManutencoes}</div>
            <p className="text-xs text-gray-600 mt-1">
              Agendadas para os próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Manutenções Pendentes
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.manutencoesPendentes}</div>
            <p className="text-xs text-gray-600 mt-1">
              Manutenções vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Manutenções Realizadas
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.manutencoesRealizadas}</div>
            <p className="text-xs text-gray-600 mt-1">
              Total de manutenções concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tickets Abertos
            </CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.ticketsAbertos}</div>
            <p className="text-xs text-gray-600 mt-1">
              Tickets de manutenção em andamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openCronogramaDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Cronograma
        </Button>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="cronogramas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cronogramas">Cronogramas</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>
        
        {/* Tab de Cronograma */}
        <TabsContent value="cronogramas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              {cronogramas.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum cronograma de manutenção encontrado.
                </div>
              ) : (
                <div className="space-y-4">
                  {cronogramas.map((cronograma) => (
                    <div 
                      key={cronograma.id} 
                      className={`p-4 rounded-lg border ${isVencida(cronograma.proxima_manutencao) ? 'border-red-200 bg-red-50' : isProxima(cronograma.proxima_manutencao) ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {cronograma.contrato?.descricao || `Contrato #${cronograma.contrato_id.substring(0, 8)}`}
                          </h3>
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
                      {/* ✅ NOVO: Botões de ação */}
                      <div className="mt-3 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openCronogramaDialog(cronograma)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCronograma(cronograma.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tickets de Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsManutencao.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum ticket de manutenção encontrado.
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketsManutencao.map((ticket) => (
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
                      <div className="mt-2 flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Criado: {formatarData(ticket.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum registro de manutenção encontrado.
                </div>
              ) : (
                <div className="space-y-4">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Relatórios */}
        <TabsContent value="relatorios" className="space-y-4">
          <RelatorioManutencao />
        </TabsContent>
      </Tabs>

      {/* ✅ NOVO: Modal de Criação/Edição de Cronograma */}
      <Dialog open={isCronogramaDialogOpen} onOpenChange={setIsCronogramaDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingCronograma ? 'Editar Cronograma' : 'Criar Novo Cronograma'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contrato_id">Contrato</Label>
              <Select
                value={cronogramaFormData.contrato_id}
                onValueChange={(value) => setCronogramaFormData({ ...cronogramaFormData, contrato_id: value })}
                disabled={isEditingCronograma}
              >
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_manutencao">Tipo de Manutenção</Label>
                <Select
                  value={cronogramaFormData.tipo_manutencao}
                  onValueChange={(value: 'preventiva' | 'corretiva' | 'preditiva') => 
                    setCronogramaFormData({ ...cronogramaFormData, tipo_manutencao: value })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="frequencia">Frequência</Label>
                <Select
                  value={cronogramaFormData.frequencia}
                  onValueChange={(value: 'mensal' | 'trimestral' | 'semestral' | 'anual') => 
                    setCronogramaFormData({ ...cronogramaFormData, frequencia: value })
                  }
                >
                  <SelectTrigger>
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
              <Label htmlFor="proxima_manutencao">Próxima Manutenção</Label>
              <Input
                id="proxima_manutencao"
                type="date"
                value={cronogramaFormData.proxima_manutencao}
                onChange={(e) => setCronogramaFormData({ ...cronogramaFormData, proxima_manutencao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre o cronograma..."
                value={cronogramaFormData.observacoes}
                onChange={(e) => setCronogramaFormData({ ...cronogramaFormData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCronogramaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveCronograma}>
                {isEditingCronograma ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}