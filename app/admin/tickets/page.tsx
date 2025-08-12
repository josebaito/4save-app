'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Eye, User, RefreshCw, XCircle, AlertTriangle, RotateCcw, Zap } from 'lucide-react';
import { db } from '@/lib/db/supabase';
import type { Ticket, Cliente, Contrato, User as UserType } from '@/types';
import { toast } from 'sonner';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [tecnicos, setTecnicos] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTecnico, setFilterTecnico] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    loadData();
  }, []);

  // Forçar reload dos dados
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5000); // Recarregar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [ticketsData, clientesData, contratosData, tecnicosData] = await Promise.all([
        db.getTickets(),
        db.getClientes(),
        db.getContratos(),
        db.getTecnicos()
      ]);

      setTickets(ticketsData);
      setClientes(clientesData);
      setContratos(contratosData);
      setTecnicos(tecnicosData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedTicket) {
        await db.updateTicket(selectedTicket.id, formData);
        toast.success('Ticket atualizado com sucesso!');
      } else {
        await db.createTicket(formData);
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
    try {
      await db.updateTicket(ticket.id, { 
        status: 'pendente',
        motivo_cancelamento: undefined // Limpar o motivo do cancelamento
      });
      toast.success('Ticket reativado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Error reactivating ticket:', error);
      toast.error('Erro ao reativar ticket');
    }
  };

  const handleAtribuicaoInteligente = async (ticket: Ticket) => {
    try {
      toast.info('Atribuindo técnico automaticamente...');
      
      const tipoProduto = ticket.contrato?.tipo_produto;
      const tecnicoAtribuido = await db.atribuirTecnicoInteligente(ticket.id, tipoProduto);
      
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClienteContratos = (clienteId: string) => {
    return contratos.filter(c => c.cliente_id === clienteId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
            <p className="text-gray-600">Gerencie os tickets de atendimento</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleNewTicket} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Ticket
            </Button>
          </div>
        </div>

        {/* Alert para tickets cancelados */}
        {filteredTickets.filter(t => t.status === 'cancelado').length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800">
                      Tickets Cancelados Requerem Atenção
                    </h3>
                    <p className="text-sm text-red-700">
                      {filteredTickets.filter(t => t.status === 'cancelado').length} ticket(s) cancelado(s) aguardando reativação
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterStatus('cancelado')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Ver Cancelados
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título, cliente ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                className="col-span-4"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Tickets ({filteredTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{ticket.titulo}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Cliente: {ticket.cliente?.nome}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {ticket.descricao}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {ticket.tecnico ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            {ticket.tecnico.name}
                          </div>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Necessita técnico
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(ticket.prioridade)}>
                        {ticket.prioridade}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant={ticket.tipo === 'instalacao' ? 'secondary' : 'outline'}>
                        {ticket.tipo === 'instalacao' ? 'Instalação' : 'Manutenção'}
                      </Badge>
                      
                      {/* Motivo do cancelamento */}
                      {ticket.status === 'cancelado' && ticket.motivo_cancelamento && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="max-w-xs truncate" title={ticket.motivo_cancelamento}>
                            {ticket.motivo_cancelamento}
                          </span>
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(ticket)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {!ticket.tecnico_id && ticket.status !== 'cancelado' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAtribuicaoInteligente(ticket)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Atribuir técnico automaticamente"
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Auto
                        </Button>
                      )}
                      
                      {ticket.status === 'cancelado' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivateTicket(ticket)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reativar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ticket)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum ticket encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Ticket' : selectedTicket ? 'Detalhes do Ticket' : 'Novo Ticket'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, cliente_id: value, contrato_id: '' });
                    }}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="contrato_id">Contrato</Label>
                  <Select
                    value={formData.contrato_id}
                    onValueChange={(value) => setFormData({ ...formData, contrato_id: value })}
                    disabled={!formData.cliente_id || (!isEditing && !!selectedTicket)}
                  >
                    <SelectTrigger>
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
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  disabled={!isEditing && !!selectedTicket}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  disabled={!isEditing && !!selectedTicket}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value: 'baixa' | 'media' | 'alta' | 'urgente') => setFormData({ ...formData, prioridade: value })}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="tipo">Tipo de Ticket</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'instalacao' | 'manutencao') => setFormData({ ...formData, tipo: value })}
                    disabled={(!isEditing && !!selectedTicket) || (isEditing && formData.tipo === 'instalacao')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instalacao">Instalação</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.tipo === 'instalacao' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Este é um ticket de instalação criado automaticamente a partir de um contrato.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pendente' | 'em_curso' | 'finalizado') => setFormData({ ...formData, status: value })}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="tecnico_id">Técnico</Label>
                  <Select
                    value={formData.tecnico_id}
                    onValueChange={(value) => setFormData({ ...formData, tecnico_id: value })}
                    disabled={!isEditing && !!selectedTicket}
                  >
                    <SelectTrigger>
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
                    <p className="text-xs text-amber-500 mt-1">
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
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
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