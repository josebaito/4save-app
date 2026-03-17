'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Eye, User, RefreshCw, AlertTriangle, RotateCcw, Zap } from 'lucide-react';
import { db } from '@/lib/db/supabase';
import { Pagination } from '@/components/ui/pagination';
import type { Ticket, Cliente, Contrato, User as UserType } from '@/types';
import { toast } from 'sonner';

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [tecnicos, setTecnicos] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTecnico, setFilterTecnico] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    contrato_id: '',
    tecnico_id: 'none',
    titulo: '',
    descricao: '',
    tipo: 'manutencao' as 'instalacao' | 'manutencao',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    status: 'pendente' as 'pendente' | 'em_curso' | 'finalizado' | 'cancelado'
  });

  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.accessToken) {
      loadData();
    }
  }, [status, session]);

  // Forçar reload dos dados
  useEffect(() => {
    if (status !== 'authenticated' || !(session as any)?.accessToken) return;

    const interval = setInterval(() => {
      loadData();
    }, 5000); // Recarregar a cada 5 segundos

    return () => clearInterval(interval);
  }, [status, session]);

  const loadData = async () => {
    if (!(session as any)?.accessToken) return;

    try {
      const token = (session as any).accessToken;

      const [ticketsData, clientesData, contratosData, tecnicosData] = await Promise.all([
        db.getTickets(token),
        db.getClientes(token),
        db.getContratos(token),
        db.getTecnicos(token)
      ]);

      setTickets(ticketsData);
      setClientes(clientesData);
      setContratos(contratosData);
      setTecnicos(tecnicosData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Removed generic toast error to avoid spamming if just one request fails during polling
      // toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'all' || ticket.tipo === filterTipo;
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesTecnico = filterTecnico === 'all' ||
      (filterTecnico === 'sem_tecnico' && (!ticket.tecnico_id || ticket.tecnico_id === 'none')) ||
      ticket.tecnico_id === filterTecnico;

    return matchesSearch && matchesTipo && matchesStatus && matchesTecnico;
  });

  const totalTickets = filteredTickets.length;
  const paginatedTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterTipo, filterStatus, filterTecnico]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(session as any)?.accessToken) {
      toast.error('Erro de autenticação');
      return;
    }

    try {
      const token = (session as any).accessToken;

      if (isEditing && selectedTicket) {
        await db.updateTicket(selectedTicket.id, formData, token);
        toast.success('Ticket atualizado com sucesso!');
      } else {
        await db.createTicket(formData, token);
        toast.success('Ticket criado com sucesso!');
      }

      await loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast.error('Erro ao salvar ticket');
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      contrato_id: '',
      tecnico_id: 'none',
      titulo: '',
      descricao: '',
      tipo: 'manutencao',
      prioridade: 'media',
      status: 'pendente'
    });
    setSelectedTicket(null);
    setIsEditing(false);
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      cliente_id: ticket.cliente_id,
      contrato_id: ticket.contrato_id,
      tecnico_id: ticket.tecnico_id || '',
      titulo: ticket.titulo,
      descricao: ticket.descricao,
      tipo: ticket.tipo || 'manutencao',
      prioridade: ticket.prioridade,
      status: ticket.status
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      cliente_id: ticket.cliente_id,
      contrato_id: ticket.contrato_id,
      tecnico_id: ticket.tecnico_id || '',
      titulo: ticket.titulo,
      descricao: ticket.descricao,
      tipo: ticket.tipo || 'manutencao',
      prioridade: ticket.prioridade,
      status: ticket.status
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleReactivateTicket = async (ticket: Ticket) => {
    if (!(session as any)?.accessToken) return;

    try {
      const token = (session as any).accessToken;

      await db.updateTicket(ticket.id, {
        status: 'pendente',
        motivo_cancelamento: undefined // Limpar o motivo do cancelamento
      }, token);
      toast.success('Ticket reativado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Error reactivating ticket:', error);
      toast.error('Erro ao reativar ticket');
    }
  };

  const handleAtribuicaoInteligente = async (ticket: Ticket) => {
    if (!(session as any)?.accessToken) return;

    try {
      toast.info('Atribuindo técnico automaticamente...');

      const token = (session as any).accessToken;

      const tipoProduto = ticket.contrato?.tipo_produto;
      const tecnicoAtribuido = await db.atribuirTecnicoInteligente(ticket.id, tipoProduto, token);

      if (tecnicoAtribuido) {
        toast.success(`Técnico ${tecnicoAtribuido.name} atribuído automaticamente!`);
      } else {
        toast.error('Nenhum técnico disponível encontrado');
      }

      loadData();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('Erro ao atribuir técnico automaticamente');
    }
  };

  const handleNewTicket = () => {
    resetForm();
    setIsDialogOpen(true);
  };


  const getClienteContratos = (clienteId: string) => {
    return contratos.filter(c => c.cliente_id === clienteId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tickets</h1>
            <p className="text-sm text-muted-foreground">Gerir os tickets de atendimento</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={loadData} variant="outline" size="sm" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            <Button onClick={handleNewTicket} size="sm" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4" />
              Novo Ticket
            </Button>
          </div>
        </div>

        {/* Alert para tickets cancelados */}
        {filteredTickets.filter(t => t.status === 'cancelado').length > 0 && (
          <Card className="border-red-500/20 bg-red-500/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="font-semibold text-red-500 dark:text-red-400">
                      Tickets Cancelados Requerem Atenção
                    </h3>
                    <p className="text-sm text-red-400">
                      {filteredTickets.filter(t => t.status === 'cancelado').length} ticket(s) cancelado(s) aguardando reativação
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterStatus('cancelado')}
                  className="border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-500/10"
                >
                  Ver Cancelados
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, cliente ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_curso">Em curso</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTecnico} onValueChange={setFilterTecnico}>
                <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                  <SelectValue placeholder="Filtrar por técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os técnicos</SelectItem>
                  <SelectItem value="sem_tecnico">Sem técnico atribuído</SelectItem>
                  {tecnicos.map((tecnico) => (
                    <SelectItem key={tecnico.id} value={tecnico.id}>
                      {tecnico.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterTipo('all');
                  setFilterStatus('all');
                  setFilterTecnico('all');
                }}
                className="col-span-4 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Tickets ({filteredTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTickets.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-secondary/40 rounded-xl hover:bg-secondary/60 transition-colors border border-border"
                  >
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground truncate">{ticket.titulo}</h4>
                        <Badge variant={ticket.tipo === 'instalacao' ? 'info' : 'muted'} className="shrink-0">
                          {ticket.tipo === 'instalacao' ? 'Instalação' : 'Manutenção'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.cliente?.nome}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">
                        {ticket.descricao}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {ticket.tecnico ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{ticket.tecnico.name}</span>
                          </div>
                        ) : (
                          <Badge variant="warning" className="text-xs">Sem técnico</Badge>
                        )}
                        <span className="text-xs text-muted-foreground/60">
                          {new Date(ticket.created_at).toLocaleDateString('pt-PT')}
                        </span>
                        {ticket.status === 'cancelado' && ticket.motivo_cancelamento && (
                          <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 max-w-[200px]">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="truncate" title={ticket.motivo_cancelamento}>
                              {ticket.motivo_cancelamento}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badges + Acções */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Badge variant={ticket.prioridade as 'alta' | 'media' | 'baixa' | 'urgente'}>
                        {ticket.prioridade}
                      </Badge>
                      <Badge variant={ticket.status as 'pendente' | 'em_curso' | 'finalizado' | 'cancelado'}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>

                      <div className="flex items-center gap-1 ml-auto sm:ml-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(ticket)}
                          className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {!ticket.tecnico_id && ticket.status !== 'cancelado' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAtribuicaoInteligente(ticket)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 border-blue-500/30 h-8 px-2"
                            title="Atribuir técnico automaticamente"
                          >
                            <Zap className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {ticket.status === 'cancelado' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivateTicket(ticket)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 border-emerald-500/30 h-8 px-2"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ticket)}
                            className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
                {totalTickets > 0 && (
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={totalTickets}
                    onPageChange={setPage}
                    onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
                    label="tickets"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground/70">
                <p className="text-muted-foreground">Nenhum ticket encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-[700px] max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {isEditing ? 'Editar Ticket' : selectedTicket ? 'Detalhes do Ticket' : 'Novo Ticket'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id" className="text-foreground/80">Cliente</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, cliente_id: value, contrato_id: '' });
                    }}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contrato_id" className="text-foreground/80">Contrato</Label>
                  <Select
                    value={formData.contrato_id}
                    onValueChange={(value) => setFormData({ ...formData, contrato_id: value })}
                    disabled={!formData.cliente_id || (!isEditing && !!selectedTicket)}
                  >
                    <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                      <SelectValue placeholder="Selecione um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {getClienteContratos(formData.cliente_id).map((contrato) => (
                        <SelectItem key={contrato.id} value={contrato.id}>
                          {contrato.numero} - {contrato.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-foreground/80">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  disabled={!isEditing && !!selectedTicket}
                  className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-foreground/80">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  disabled={!isEditing && !!selectedTicket}
                  rows={3}
                  className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridade" className="text-foreground/80">Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value: 'baixa' | 'media' | 'alta' | 'urgente') => setFormData({ ...formData, prioridade: value })}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-foreground/80">Tipo de Ticket</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'instalacao' | 'manutencao') => setFormData({ ...formData, tipo: value })}
                    disabled={(!isEditing && !!selectedTicket) || (isEditing && formData.tipo === 'instalacao')}
                  >
                    <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instalacao">Instalação</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.tipo === 'instalacao' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Este é um ticket de instalação criado automaticamente a partir de um contrato.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground/80">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pendente' | 'em_curso' | 'finalizado') => setFormData({ ...formData, status: value })}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_curso">Em Curso</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tecnico_id" className="text-foreground/80">Técnico</Label>
                  <Select
                    value={formData.tecnico_id}
                    onValueChange={(value) => setFormData({ ...formData, tecnico_id: value })}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger className="bg-secondary/60 border-input text-foreground">
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem técnico</SelectItem>
                      {tecnicos.map((tecnico) => (
                        <SelectItem key={tecnico.id} value={tecnico.id}>
                          {tecnico.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.tipo === 'instalacao' && formData.tecnico_id === 'none' && (
                    <p className="text-xs text-amber-400 mt-1">
                      É necessário atribuir um técnico para realizar a instalação.
                    </p>
                  )}
                </div>
              </div>
              {(isEditing || !selectedTicket) && (
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isEditing ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 