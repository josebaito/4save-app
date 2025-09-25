'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Eye, Calendar, Clock, DollarSign } from 'lucide-react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';
import type { Contrato, Cliente, TipoProduto, PlanoManutencao, CronogramaManutencao } from '@/types';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cronogramas, setCronogramas] = useState<CronogramaManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    numero: '',
    descricao: '',
    valor: '',
    data_inicio: '',
    data_fim: '',
    tipo_produto: 'solar_baterias' as TipoProduto,
    segmento: 'domestico' as 'domestico' | 'industrial' | 'outro',
    status: 'ativo' as 'ativo' | 'inativo' | 'vencido',
    // ✅ NOVO: Campos de plano de manutenção
    plano_manutencao: {
      tipo: 'preventiva' as 'preventiva' | 'corretiva' | 'preditiva',
      frequencia: 'mensal' as 'mensal' | 'trimestral' | 'semestral' | 'anual',
      inicio_manutencao: '',
      duracao_contrato: 12,
      valor_manutencao: 0,
      observacoes: ''
    } as PlanoManutencao
  });

  const tipoProdutoOptions = [
    { value: 'solar_baterias', label: 'Solar com Baterias' },
    { value: 'solar', label: 'Solar apenas' },
    { value: 'baterias', label: 'Baterias apenas' },
    { value: 'furo_agua', label: 'Furo de Água' },
    { value: 'tratamento_agua', label: 'Tratamento de Água' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contratosData, clientesData, cronogramasData] = await Promise.all([
        db.getContratos(),
        db.getClientes(),
        db.getCronogramasManutencao()
      ]);

      setContratos(contratosData);
      setClientes(clientesData);
      setCronogramas(cronogramasData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = contrato.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = filterCliente === 'all' || contrato.cliente_id === filterCliente;
    const matchesStatus = filterStatus === 'all' || contrato.status === filterStatus;
    
    return matchesSearch && matchesCliente && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const contratoData = {
        ...formData,
        valor: parseFloat(formData.valor) || 0,
        numero: formData.numero || `CTR-${new Date().getFullYear()}-${String(contratos.length + 1).padStart(3, '0')}`,
        equipamentos: [],
        // ✅ NOVO: Incluir plano de manutenção
        plano_manutencao: formData.plano_manutencao
      };

      let resultado: Contrato | null = null;

      if (isEditing && selectedContrato) {
        try {
          resultado = await db.updateContrato(selectedContrato.id, contratoData);
          toast.success('Contrato atualizado com sucesso!');
        } catch (updateError: unknown) {
          const errorMessage = updateError instanceof Error ? updateError.message : 'Erro desconhecido';
          console.error('Erro ao atualizar contrato:', errorMessage);
          throw new Error(`Erro ao atualizar contrato: ${errorMessage}`);
        }
      } else {
        // Criar contrato
        try {
          resultado = await db.createContrato(contratoData);
          
          // ✅ NOVO: Criar cronograma de manutenção automaticamente
          if (resultado && resultado.id && formData.plano_manutencao.inicio_manutencao) {
            try {
              await db.criarCronogramaManutencao(resultado.id, formData.plano_manutencao);
              toast.success('Contrato e cronograma de manutenção criados com sucesso!');
            } catch (cronogramaError) {
              console.error('Erro ao criar cronograma:', cronogramaError);
              toast.success('Contrato criado com sucesso! Erro ao criar cronograma de manutenção.');
            }
          } else {
            toast.success('Contrato criado com sucesso!');
          }
          
          // Criar automaticamente um ticket de instalação para este contrato
          if (resultado && resultado.id) {
            const contrato = resultado;
            const novoTicket = {
              cliente_id: contrato.cliente_id,
              contrato_id: contrato.id,
              titulo: `Instalação - ${contrato.numero}`,
              descricao: `Ticket de instalação criado automaticamente para o contrato ${contrato.numero}. Tipo de produto: ${tipoProdutoOptions.find(opt => opt.value === contrato.tipo_produto)?.label || contrato.tipo_produto}`,
              tipo: 'instalacao' as 'instalacao' | 'manutencao',
              prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
              status: 'pendente' as 'pendente' | 'em_curso' | 'finalizado'
            };
            
            await db.createTicket(novoTicket);
          }
        } catch (createError: unknown) {
          const errorMessage = createError instanceof Error ? createError.message : 'Erro desconhecido';
          console.error('Erro ao criar contrato:', errorMessage);
          throw new Error(`Erro ao criar contrato: ${errorMessage}`);
        }
      }
      
      // Recarregar dados
      await loadData();
      
      // Fechar modal e limpar formulário
      setIsDialogOpen(false);
      setSelectedContrato(null);
      setIsEditing(false);
      setFormData({
        cliente_id: '',
        numero: '',
        descricao: '',
        valor: '',
        data_inicio: '',
        data_fim: '',
        tipo_produto: 'solar_baterias',
        segmento: 'domestico',
        status: 'ativo',
        plano_manutencao: {
          tipo: 'preventiva',
          frequencia: 'mensal',
          inicio_manutencao: '',
          duracao_contrato: 12,
          valor_manutencao: 0,
          observacoes: ''
        }
      });
    } catch (error: unknown) {
      console.error('Erro no submit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar contrato';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (contrato: Contrato) => {
    setFormData({
      cliente_id: contrato.cliente_id,
      numero: contrato.numero,
      descricao: contrato.descricao,
      valor: contrato.valor.toString(),
      data_inicio: contrato.data_inicio,
      data_fim: contrato.data_fim,
      tipo_produto: contrato.tipo_produto || 'solar_baterias',
      segmento: contrato.segmento || 'domestico',
      status: contrato.status,
      plano_manutencao: contrato.plano_manutencao || {
        tipo: 'preventiva',
        frequencia: 'mensal',
        inicio_manutencao: '',
        duracao_contrato: 12,
        valor_manutencao: 0,
        observacoes: ''
      }
    });
    setSelectedContrato(contrato);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleView = (contrato: Contrato) => {
    setFormData({
      cliente_id: contrato.cliente_id,
      numero: contrato.numero,
      descricao: contrato.descricao,
      valor: contrato.valor.toString(),
      data_inicio: contrato.data_inicio,
      data_fim: contrato.data_fim,
      tipo_produto: contrato.tipo_produto || 'solar_baterias',
      segmento: contrato.segmento || 'domestico',
      status: contrato.status,
      plano_manutencao: contrato.plano_manutencao || {
        tipo: 'preventiva',
        frequencia: 'mensal',
        inicio_manutencao: '',
        duracao_contrato: 12,
        valor_manutencao: 0,
        observacoes: ''
      }
    });
    setSelectedContrato(contrato);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setFormData({
      cliente_id: '',
      numero: '',
      descricao: '',
      valor: '',
      data_inicio: '',
      data_fim: '',
      tipo_produto: 'solar_baterias',
      segmento: 'domestico',
      status: 'ativo',
      plano_manutencao: {
        tipo: 'preventiva',
        frequencia: 'mensal',
        inicio_manutencao: '',
        duracao_contrato: 12,
        valor_manutencao: 0,
        observacoes: ''
      }
    });
    setSelectedContrato(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };


  const isVencido = (dataFim: string) => {
    return new Date(dataFim) < new Date();
  };

  const formatarData = (dataString: string) => {
    try {
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Contratos</h1>
            <p className="text-slate-400">Gerencie contratos de clientes</p>
          </div>
          <Button onClick={handleNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Novo Contrato
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por número, descrição ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterCliente('all');
                  setFilterStatus('all');
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contratos List */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">
              Contratos ({filteredContratos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : filteredContratos.length > 0 ? (
              <div className="space-y-4">
                {filteredContratos.map((contrato) => (
                  <div
                    key={contrato.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white">{contrato.numero}</h4>
                        {isVencido(contrato.data_fim) && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">Vencido</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mb-1">
                        Cliente: {contrato.cliente?.nome}
                      </p>
                      <p className="text-sm text-slate-400 mb-1">
                        {contrato.descricao}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contrato.data_inicio).toLocaleDateString('pt-BR')} - {new Date(contrato.data_fim).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          €{contrato.valor.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={contrato.status === 'ativo' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                      contrato.status === 'vencido' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                      'bg-slate-600/50 text-slate-300 border-slate-500/50'}>
                        {contrato.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(contrato)}
                        className="text-slate-400 hover:text-white hover:bg-slate-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contrato)}
                        className="text-slate-400 hover:text-white hover:bg-slate-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-slate-400">Nenhum contrato encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {isEditing ? 'Editar Contrato' : selectedContrato ? 'Detalhes do Contrato' : 'Novo Contrato'}
              </DialogTitle>
              {!isEditing && !selectedContrato && (
                <p className="text-sm text-slate-400 mt-2">
                  Ao criar um novo contrato, um ticket de instalação será criado automaticamente.
                </p>
              )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id" className="text-slate-200">Cliente</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                    disabled={!isEditing && !!selectedContrato}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero" className="text-slate-200">Número do Contrato</Label>
                  <Input
                    id="numero"
                    placeholder="CTR-2024-001 (automático se vazio)"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    disabled={!isEditing && !!selectedContrato}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-slate-200">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição do contrato..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  disabled={!isEditing && !!selectedContrato}
                  rows={3}
                  className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-slate-200">Valor (€)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedContrato}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_inicio" className="text-slate-200">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedContrato}
                    className="bg-slate-700/50 border-slate-600/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim" className="text-slate-200">Data de Fim</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedContrato}
                    className="bg-slate-700/50 border-slate-600/50 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_produto" className="text-slate-200">Tipo de Produto</Label>
                  <Select
                    value={formData.tipo_produto}
                    onValueChange={(value: TipoProduto) => setFormData({ ...formData, tipo_produto: value })}
                    disabled={!isEditing && !!selectedContrato}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {tipoProdutoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segmento" className="text-slate-200">Segmento</Label>
                  <Select
                    value={formData.segmento}
                    onValueChange={(value: 'domestico' | 'industrial' | 'outro') => setFormData({ ...formData, segmento: value })}
                    disabled={!isEditing && !!selectedContrato}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="domestico">Doméstico</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-200">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'ativo' | 'inativo' | 'vencido') => setFormData({ ...formData, status: value })}
                  disabled={!isEditing && !!selectedContrato}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ NOVO: Seção de Plano de Manutenção */}
              <div className="space-y-4 border-t border-slate-700 pt-4">
                <h3 className="text-lg font-medium text-white">Plano de Manutenção</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_manutencao" className="text-slate-200">Tipo de Manutenção</Label>
                    <Select
                      value={formData.plano_manutencao.tipo}
                      onValueChange={(value: 'preventiva' | 'corretiva' | 'preditiva') => 
                        setFormData({
                          ...formData,
                          plano_manutencao: { ...formData.plano_manutencao, tipo: value }
                        })
                      }
                      disabled={!isEditing && !!selectedContrato}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="preventiva">Preventiva</SelectItem>
                        <SelectItem value="corretiva">Corretiva</SelectItem>
                        <SelectItem value="preditiva">Preditiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="frequencia" className="text-slate-200">Frequência</Label>
                    <Select
                      value={formData.plano_manutencao.frequencia}
                      onValueChange={(value: 'mensal' | 'trimestral' | 'semestral' | 'anual') => 
                        setFormData({
                          ...formData,
                          plano_manutencao: { ...formData.plano_manutencao, frequencia: value }
                        })
                      }
                      disabled={!isEditing && !!selectedContrato}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inicio_manutencao" className="text-slate-200">Início da Manutenção</Label>
                    <Input
                      id="inicio_manutencao"
                      type="date"
                      value={formData.plano_manutencao.inicio_manutencao}
                      onChange={(e) => 
                        setFormData({
                          ...formData,
                          plano_manutencao: { ...formData.plano_manutencao, inicio_manutencao: e.target.value }
                        })
                      }
                      disabled={!isEditing && !!selectedContrato}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duracao_contrato" className="text-slate-200">Duração (meses)</Label>
                    <Input
                      id="duracao_contrato"
                      type="number"
                      min="1"
                      value={formData.plano_manutencao.duracao_contrato}
                      onChange={(e) => 
                        setFormData({
                          ...formData,
                          plano_manutencao: { ...formData.plano_manutencao, duracao_contrato: parseInt(e.target.value) || 12 }
                        })
                      }
                      disabled={!isEditing && !!selectedContrato}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="valor_manutencao" className="text-slate-200">Valor Manutenção (€)</Label>
                    <Input
                      id="valor_manutencao"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.plano_manutencao.valor_manutencao}
                      onChange={(e) => 
                        setFormData({
                          ...formData,
                          plano_manutencao: { ...formData.plano_manutencao, valor_manutencao: parseFloat(e.target.value) || 0 }
                        })
                      }
                      disabled={!isEditing && !!selectedContrato}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes_manutencao" className="text-slate-200">Observações do Plano</Label>
                  <Textarea
                    id="observacoes_manutencao"
                    placeholder="Observações sobre o plano de manutenção..."
                    value={formData.plano_manutencao.observacoes || ''}
                    onChange={(e) => 
                      setFormData({
                        ...formData,
                        plano_manutencao: { ...formData.plano_manutencao, observacoes: e.target.value }
                      })
                    }
                    disabled={!isEditing && !!selectedContrato}
                    rows={3}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* ✅ NOVO: Seção de Cronogramas Ativos */}
                {selectedContrato && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-md font-medium">Cronogramas Ativos</h4>
                    {(() => {
                      const cronogramasContrato = cronogramas.filter(c => c.contrato_id === selectedContrato.id);
                      return cronogramasContrato.length > 0 ? (
                        <div className="space-y-2">
                          {cronogramasContrato.map((cronograma) => (
                            <div 
                              key={cronograma.id} 
                              className={`p-3 rounded-lg border ${isVencida(cronograma.proxima_manutencao) ? 'border-red-200 bg-red-50' : isProxima(cronograma.proxima_manutencao) ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex gap-2 mb-1">
                                    <Badge className={`${cronograma.tipo_manutencao === 'preventiva' ? 'bg-blue-100 text-blue-800' : cronograma.tipo_manutencao === 'corretiva' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                                      {cronograma.tipo_manutencao}
                                    </Badge>
                                    <Badge className="bg-gray-100 text-gray-800">
                                      {cronograma.frequencia}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Próxima: <span className={`font-medium ${isVencida(cronograma.proxima_manutencao) ? 'text-red-600' : isProxima(cronograma.proxima_manutencao) ? 'text-yellow-600' : ''}`}>{formatarData(cronograma.proxima_manutencao)}</span></span>
                                    </div>
                                    {cronograma.ultima_manutencao && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Última: {formatarData(cronograma.ultima_manutencao)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge className={`${cronograma.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {cronograma.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Nenhum cronograma ativo para este contrato.
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {(isEditing || !selectedContrato) && (
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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