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
import { Search, Plus, Edit, Eye, Calendar, DollarSign, RefreshCw, Trash2 } from 'lucide-react';
import { getSession, signOut } from 'next-auth/react';
import { db } from '@/lib/db/supabase';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import type { Contrato, Cliente, TipoProduto, PlanoManutencao } from '@/types';

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ NOVO: Estados para controle do plano de manutenção
  const [showPlanoManutencao, setShowPlanoManutencao] = useState(false);
  const [contratoCriado, setContratoCriado] = useState<Contrato | null>(null);
  const [perguntaPlanoDialog, setPerguntaPlanoDialog] = useState(false);
  // Quando verdadeiro, estamos apenas a configurar/editar o plano após criar contrato,
  // e os campos do próprio contrato devem ficar bloqueados.
  const [isPlanoOnlyMode, setIsPlanoOnlyMode] = useState(false);
  // Contrato a marcar como inativo (confirmação)
  const [contratoToEliminar, setContratoToEliminar] = useState<Contrato | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const todayInputDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    cliente_id: '',
    numero: '',
    descricao: '',
    valor: '',
    data_inicio: todayInputDate(),
    data_fim: '',
    tipo_produto: 'solar_baterias' as TipoProduto,
    segmento: 'domestico' as 'domestico' | 'industrial' | 'outro',
    status: 'ativo' as 'ativo' | 'inativo' | 'vencido',
    // ✅ NOVO: Campos de plano de manutenção
    plano_manutencao: {
      tipo_manutencao: 'preventiva' as 'preventiva' | 'corretiva' | 'preditiva',
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
      const session: { accessToken?: string } | null = await getSession();
      const token = session?.accessToken;

      if (!token) {
        toast.error('Sessão expirada ou não autorizada. A terminar sessão...');
        await signOut({ callbackUrl: '/auth/signin', redirect: true });
        return;
      }

      const [contratosData, clientesData] = await Promise.all([
        db.getContratos(token),
        db.getClientes(token)
      ]);

      setContratos(contratosData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
      // Se for 401, terminar sessão
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        toast.error('Sessão expirada. A terminar sessão...');
        await signOut({ callbackUrl: '/auth/signin', redirect: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = contrato.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = filterCliente === 'all' || contrato.cliente_id === filterCliente;
    // Por defeito ("all") mostramos apenas em vigor (ativo + vencido); inativos só ao filtrar
    const matchesStatus =
      filterStatus === 'all'
        ? contrato.status !== 'inativo'
        : contrato.status === filterStatus;

    return matchesSearch && matchesCliente && matchesStatus;
  });

  const totalContratos = filteredContratos.length;
  const paginatedContratos = filteredContratos.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCliente, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const session: { accessToken?: string } | null = await getSession();
    const token = session?.accessToken;

    if (!token) {
      toast.error('Sessão expirada ou não autorizada. A terminar sessão...');
      await signOut({ callbackUrl: '/auth/signin', redirect: true });
      return;
    }

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
          resultado = await db.updateContrato(selectedContrato.id, contratoData, token);

          // ✅ NOVO: Criar cronograma de manutenção se plano foi adicionado
          if (resultado && resultado.id && formData.plano_manutencao.inicio_manutencao) {
            try {
              // Verificar se já existe cronograma para este contrato
              const cronogramasExistentes = await db.getCronogramasManutencao(token);
              const cronogramaExistente = cronogramasExistentes.find(c => c.contrato_id === resultado.id);

              if (!cronogramaExistente) {
                await db.criarCronogramaManutencao(resultado.id, formData.plano_manutencao, token);
                toast.success('Contrato atualizado e cronograma de manutenção criado com sucesso!');
              } else {
                toast.success('Contrato atualizado com sucesso! (Cronograma já existia)');
              }
            } catch (cronogramaError) {
              console.error('Erro ao criar cronograma:', cronogramaError);
              toast.success('Contrato atualizado com sucesso! Erro ao criar cronograma de manutenção.');
            }
          } else {
            toast.success('Contrato atualizado com sucesso!');
          }
        } catch (updateError: unknown) {
          const errorMessage = updateError instanceof Error ? updateError.message : 'Erro desconhecido';
          console.error('Erro ao atualizar contrato:', errorMessage);
          throw new Error(`Erro ao atualizar contrato: ${errorMessage}`);
        }
      } else {
        // Criar contrato
        try {
          resultado = await db.createContrato(contratoData, token);

          // Criar automaticamente um ticket de instalação (não bloqueia: se falhar, contrato já foi criado)
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

            try {
              await db.createTicket(novoTicket, token);
            } catch (ticketError) {
              console.error('Erro ao criar ticket de instalação:', ticketError);
              toast.warning('Contrato criado com sucesso. O ticket de instalação não foi criado automaticamente (pode criá-lo depois em Tickets).');
            }
          }

          // Perguntar sobre plano de manutenção após criar contrato
          setContratoCriado(resultado);
          setPerguntaPlanoDialog(true);
          toast.success('Contrato criado com sucesso!');

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
      setIsPlanoOnlyMode(false);
      setFormData({
        cliente_id: '',
        numero: '',
        descricao: '',
        valor: '',
        data_inicio: todayInputDate(),
        data_fim: '',
        tipo_produto: 'solar_baterias',
        segmento: 'domestico',
        status: 'ativo',
        plano_manutencao: {
          tipo_manutencao: 'preventiva',
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
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        toast.error('Sessão expirada. A terminar sessão...');
        await signOut({ callbackUrl: '/auth/signin', redirect: true });
      }
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
      console.error('Invalid date string:', dateString);
      return '';
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
      return String(dateString);
    }
  };

  const temPlanoVinculado = (c: Contrato | null) =>
    !!c?.plano_manutencao?.inicio_manutencao;

  const handleEdit = (contrato: Contrato) => {
    setFormData({
      cliente_id: contrato.cliente_id,
      numero: contrato.numero,
      descricao: contrato.descricao,
      valor: contrato.valor.toString(),
      data_inicio: formatDateForInput(contrato.data_inicio),
      data_fim: formatDateForInput(contrato.data_fim),
      tipo_produto: contrato.tipo_produto || 'solar_baterias',
      segmento: contrato.segmento || 'domestico',
      status: contrato.status,
      plano_manutencao: contrato.plano_manutencao ? {
        ...contrato.plano_manutencao,
        inicio_manutencao: formatDateForInput(contrato.plano_manutencao.inicio_manutencao)
      } : {
        tipo_manutencao: 'preventiva',
        frequencia: 'mensal',
        inicio_manutencao: '',
        duracao_contrato: 12,
        valor_manutencao: 0,
        observacoes: ''
      }
    });
    setSelectedContrato(contrato);
    setIsEditing(true);
    setIsPlanoOnlyMode(false);
    setIsDialogOpen(true);

    // ✅ NOVO: Verificar se contrato tem plano de manutenção
    const temPlano = contrato.plano_manutencao && contrato.plano_manutencao.inicio_manutencao;
    setShowPlanoManutencao(!!temPlano);
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
        tipo_manutencao: 'preventiva',
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
      data_inicio: todayInputDate(),
      data_fim: '',
      tipo_produto: 'solar_baterias',
      segmento: 'domestico',
      status: 'ativo',
      plano_manutencao: {
        tipo_manutencao: 'preventiva',
        frequencia: 'mensal',
        inicio_manutencao: '',
        duracao_contrato: 12,
        valor_manutencao: 0,
        observacoes: ''
      }
    });
    setSelectedContrato(null);
    setIsEditing(false);
    setIsPlanoOnlyMode(false);
    setIsDialogOpen(true);
    setShowPlanoManutencao(false); // ✅ NOVO: Não mostrar plano por padrão
  };


  const handleNaoCriarPlano = () => {
    setPerguntaPlanoDialog(false);
    setContratoCriado(null);
  };

  // Sincronizar cronogramas para contratos existentes com plano
  const handleSincronizarCronogramas = async () => {
    try {
      const session: { accessToken?: string } | null = await getSession();
      const token = session?.accessToken;
      if (!token) {
        toast.error('Sessão expirada. A terminar sessão...');
        await signOut({ callbackUrl: '/auth/signin', redirect: true });
        return;
      }
      console.log('🔄 Sincronizando cronogramas para contratos com plano...');

      let cronogramasCriados = 0;

      for (const contrato of contratos) {
        if (contrato.plano_manutencao && contrato.plano_manutencao.inicio_manutencao) {
          // Verificar se já existe cronograma para este contrato
          const cronogramasExistentes = await db.getCronogramasManutencao(token);
          const cronogramaExistente = cronogramasExistentes.find(c => c.contrato_id === contrato.id);

          if (!cronogramaExistente) {
            try {
              await db.criarCronogramaManutencao(contrato.id, contrato.plano_manutencao, token);
              cronogramasCriados++;
              console.log(`✅ Cronograma criado para contrato ${contrato.numero}`);
            } catch (error) {
              console.error(`❌ Erro ao criar cronograma para ${contrato.numero}:`, error);
            }
          }
        }
      }

      if (cronogramasCriados > 0) {
        toast.success(`${cronogramasCriados} cronograma(s) criado(s) com sucesso!`);
        await loadData(); // Recarregar dados
      } else {
        toast.info('Todos os contratos já possuem cronogramas ou não têm plano de manutenção');
      }
    } catch (error) {
      console.error('Erro ao sincronizar cronogramas:', error);
      toast.error('Erro ao sincronizar cronogramas');
    }
  };


  const isVencido = (dataFim: string) => {
    return new Date(dataFim) < new Date();
  };

  const handleEliminarClick = (contrato: Contrato) => {
    setContratoToEliminar(contrato);
  };

  const handleEliminarConfirm = async () => {
    if (!contratoToEliminar) return;
    const session = await getSession();
    const token = session?.accessToken;
    if (!token) {
      toast.error('Sessão expirada. A terminar sessão...');
      await signOut({ callbackUrl: '/auth/signin', redirect: true });
      return;
    }
    setEliminando(true);
    try {
      await db.updateContrato(contratoToEliminar.id, { status: 'inativo' } as Partial<Contrato>, token);
      toast.success(`Contrato ${contratoToEliminar.numero} marcado como inativo. Deixará de aparecer na lista por defeito.`);
      setContratoToEliminar(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao marcar contrato como inativo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao marcar como inativo');
    } finally {
      setEliminando(false);
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
          <div className="flex gap-2">
            <Button
              onClick={handleSincronizarCronogramas}
              variant="outline"
              className="flex items-center gap-2 text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Sincronizar Cronogramas
            </Button>
            <Button onClick={handleNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </div>
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
                  <SelectItem value="all">Em vigor (ativos e vencidos)</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
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
              <>
                <div className="space-y-4">
                  {paginatedContratos.map((contrato) => (
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
                      {contrato.status !== 'inativo' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarClick(contrato)}
                          className="text-slate-400 hover:text-red-300 hover:bg-red-500/20"
                          title="Marcar como inativo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
                {totalContratos > 0 && (
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={totalContratos}
                    onPageChange={setPage}
                    onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
                    label="contratos"
                  />
                )}
              </>
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

            {/* Modo Ver Detalhes: vista só de leitura com datas e plano organizados */}
            {selectedContrato && !isEditing ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Dados do contrato</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <span className="text-slate-500 block">Cliente</span>
                      <span className="text-white">{clientes.find(c => c.id === selectedContrato.cliente_id)?.nome ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Número</span>
                      <span className="text-white">{selectedContrato.numero}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Data de início</span>
                      <span className="text-white">{formatDateDisplay(selectedContrato.data_inicio)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Data de fim</span>
                      <span className="text-white">{formatDateDisplay(selectedContrato.data_fim)}</span>
                    </div>
                    {selectedContrato.created_at && (
                      <div>
                        <span className="text-slate-500 block">Data de criação</span>
                        <span className="text-white">{formatDateDisplay(selectedContrato.created_at)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 block">Valor</span>
                      <span className="text-white">€{selectedContrato.valor.toLocaleString('pt-PT')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tipo de produto</span>
                      <span className="text-white">{tipoProdutoOptions.find(o => o.value === selectedContrato.tipo_produto)?.label ?? selectedContrato.tipo_produto}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Segmento</span>
                      <span className="text-white capitalize">{selectedContrato.segmento}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <Badge className={selectedContrato.status === 'ativo' ? 'bg-green-500/20 text-green-300' : selectedContrato.status === 'vencido' ? 'bg-red-500/20 text-red-300' : 'bg-slate-600/50'}>{selectedContrato.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-sm mb-1">Descrição</span>
                    <p className="text-white text-sm">{selectedContrato.descricao || '—'}</p>
                  </div>
                </div>

                {temPlanoVinculado(selectedContrato) && selectedContrato.plano_manutencao && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-emerald-200 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Plano de manutenção
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div>
                        <span className="text-slate-500 block">Tipo</span>
                        <span className="text-white capitalize">{selectedContrato.plano_manutencao.tipo_manutencao}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Frequência</span>
                        <span className="text-white capitalize">{selectedContrato.plano_manutencao.frequencia}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Início da manutenção</span>
                        <span className="text-white">{formatDateDisplay(selectedContrato.plano_manutencao.inicio_manutencao)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Duração</span>
                        <span className="text-white">{selectedContrato.plano_manutencao.duracao_contrato} meses</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Valor manutenção</span>
                        <span className="text-white">€{Number(selectedContrato.plano_manutencao.valor_manutencao ?? 0).toLocaleString('pt-PT')}</span>
                      </div>
                      {selectedContrato.plano_manutencao.observacoes && (
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Observações</span>
                          <p className="text-white">{selectedContrato.plano_manutencao.observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!temPlanoVinculado(selectedContrato) && (
                  <p className="text-slate-500 text-sm">Este contrato não tem plano de manutenção vinculado.</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Fechar
                  </Button>
                  <Button type="button" onClick={() => selectedContrato && handleEdit(selectedContrato)} className="bg-blue-600 hover:bg-blue-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar contrato
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id" className="text-slate-200">Cliente</Label>
                    <Select
                      value={formData.cliente_id}
                      onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                      disabled={!!selectedContrato}
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
                      disabled={isEditing && !!selectedContrato}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                    />
                    {isEditing && selectedContrato && (
                      <p className="text-xs text-slate-500">O número do contrato não pode ser alterado.</p>
                    )}
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
                    rows={3}
                    disabled={isEditing && !!selectedContrato && isPlanoOnlyMode}
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
                      disabled={isEditing && !!selectedContrato && isPlanoOnlyMode}
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
                      disabled={isEditing && !!selectedContrato && isPlanoOnlyMode}
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
                      disabled={isEditing && !!selectedContrato && isPlanoOnlyMode}
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
                      disabled={isEditing && !!selectedContrato && isPlanoOnlyMode}
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
                      disabled={isEditing && !!selectedContrato && isPlanoOnlyMode}
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
                    disabled={isEditing && !!selectedContrato && isPlanoOnlyMode}
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

                {/* Secção Plano de Manutenção: em edição = vincular ou editar plano de forma clara */}
                {isEditing && (
                  <div className="space-y-4 border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-medium text-white">Plano de manutenção</h3>
                    {!showPlanoManutencao ? (
                      <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 text-center">
                        <p className="text-slate-400 mb-3">
                          {temPlanoVinculado(selectedContrato ?? null)
                            ? 'Este contrato tem um plano de manutenção vinculado. Clique em "Editar plano" para alterar os dados.'
                            : 'Nenhum plano de manutenção vinculado a este contrato. Use o botão abaixo para vincular um plano.'}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPlanoManutencao(true)}
                          className="text-slate-300 border-slate-600 hover:bg-slate-700"
                        >
                          {temPlanoVinculado(selectedContrato ?? null) ? 'Editar plano' : 'Vincular plano de manutenção'}
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">
                            {temPlanoVinculado(selectedContrato ?? null) ? 'Editar dados do plano' : 'Configurar novo plano'}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPlanoManutencao(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            {temPlanoVinculado(selectedContrato ?? null) ? 'Ocultar formulário' : 'Cancelar'}
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tipo_manutencao" className="text-slate-200">Tipo de Manutenção</Label>
                              <Select
                                value={formData.plano_manutencao.tipo_manutencao}
                                onValueChange={(value: 'preventiva' | 'corretiva' | 'preditiva') =>
                                  setFormData({
                                    ...formData,
                                    plano_manutencao: { ...formData.plano_manutencao, tipo_manutencao: value }
                                  })
                                }
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
                              rows={3}
                              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* ✅ NOVO: Seção de Cronogramas Ativos - Temporariamente removida para corrigir erro de sintaxe */}

              {(isEditing || !selectedContrato) && (
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsPlanoOnlyMode(false);
                    }}
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
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmação: marcar contrato como inativo */}
        <Dialog open={!!contratoToEliminar} onOpenChange={(open) => !open && setContratoToEliminar(null)}>
          <DialogContent className="sm:max-w-[420px] bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Marcar como inativo</DialogTitle>
              <p className="text-slate-400 text-sm mt-2">
                O contrato <strong className="text-white">{contratoToEliminar?.numero}</strong> será marcado como inativo.
                Deixará de aparecer na lista por defeito; pode ver os inativos escolhendo o filtro &quot;Inativos&quot;.
              </p>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setContratoToEliminar(null)}
                disabled={eliminando}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleEliminarConfirm}
                disabled={eliminando}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {eliminando ? 'A processar...' : 'Marcar como inativo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para perguntar sobre plano de manutenção após criar contrato */}
        <Dialog open={perguntaPlanoDialog} onOpenChange={setPerguntaPlanoDialog}>
          <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Plano de Manutenção</DialogTitle>
              <p className="text-slate-400 mt-2">
                O contrato foi criado com sucesso! Deseja configurar um plano de manutenção para este contrato?
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-sm text-slate-300">
                <p>Um plano de manutenção permite:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Criação automática de tickets de manutenção</li>
                  <li>Agendamento de manutenções preventivas</li>
                  <li>Controle de cronogramas de manutenção</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleNaoCriarPlano}
                  variant="outline"
                  className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                  Não, obrigado
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setPerguntaPlanoDialog(false);
                    setShowPlanoManutencao(true);
                    setIsPlanoOnlyMode(true);

                    // ✅ CORRIGIDO: Configurar como edição do contrato criado
                    if (contratoCriado) {
                      setSelectedContrato(contratoCriado);
                      setIsEditing(true);

                      // Carregar dados do contrato criado no formulário
                      setFormData({
                        cliente_id: contratoCriado.cliente_id,
                        numero: contratoCriado.numero,
                        descricao: contratoCriado.descricao,
                        valor: contratoCriado.valor.toString(),
                        data_inicio: contratoCriado.data_inicio,
                        data_fim: contratoCriado.data_fim,
                        tipo_produto: contratoCriado.tipo_produto || 'solar_baterias',
                        segmento: contratoCriado.segmento || 'domestico',
                        status: contratoCriado.status,
                        plano_manutencao: contratoCriado.plano_manutencao || {
                          tipo_manutencao: 'preventiva',
                          frequencia: 'mensal',
                          inicio_manutencao: '',
                          duracao_contrato: 12,
                          valor_manutencao: 0,
                          observacoes: ''
                        }
                      });
                    }

                    setIsDialogOpen(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Sim, configurar plano
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 