'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db/supabase';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Search, UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import type { User } from '@/types';

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<User[]>([]);
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('all');
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [filtroDisponibilidade, setFiltroDisponibilidade] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTecnico, setSelectedTecnico] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  useEffect(() => {
    carregarTecnicos();
  }, []);

  async function carregarTecnicos() {
    setLoading(true);
    try {
      const session: any = await import('next-auth/react').then(mod => mod.getSession());
      const token = session?.accessToken;

      // Usar a função getTecnicos do cliente db com token
      const tecnicos = await db.getTecnicos(token);

      // Usar diretamente os usuários do tipo técnico
      setTecnicos(tecnicos);
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
      toast.error('Não foi possível carregar a lista de técnicos');
    } finally {
      setLoading(false);
    }
  }

  function resetarFormulario() {
    setNome('');
    setEmail('');
    setTelefone('');
    setEspecialidade('');
    setStatus('ativo');
    setSelectedTecnico(null);
    setIsEditing(false);
  }

  function abrirFormulario(tecnico?: User, visualizacao = false) {
    resetarFormulario();
    if (tecnico) {
      setSelectedTecnico(tecnico);
      setNome(tecnico.name);
      setEmail(tecnico.email);
      setTelefone(tecnico.telefone || '');
      setEspecialidade(tecnico.especialidade || '');
      setStatus(tecnico.status || 'ativo');
      setIsEditing(visualizacao);
    }
    setIsDialogOpen(true);
  }

  async function salvarTecnico() {
    try {
      // Validação dos campos obrigatórios
      if (!nome.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }

      if (!email.trim()) {
        toast.error('Email é obrigatório');
        return;
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Email inválido');
        return;
      }

      const session: any = await import('next-auth/react').then(mod => mod.getSession());
      const token = session?.accessToken;

      if (selectedTecnico) {
        // Atualizar técnico existente (disponibilidade não se altera aqui; é o técnico que a altera na sua conta)
        await db.updateTecnico(selectedTecnico.id, {
          name: nome,
          email: email,
          telefone: telefone || undefined,
          especialidade: especialidade || undefined,
          status: status || 'ativo',
          avaliacao: 0
        }, token);

        toast.success('Técnico atualizado com sucesso');
      } else {
        // Criar novo técnico (disponível por defeito; o técnico altera na sua conta)
        const novoTecnico = {
          name: nome,
          email: email,
          password: 'tecnico123', // Senha padrão
          type: 'tecnico',
          telefone: telefone || null,
          especialidade: especialidade || null,
          status: status || 'ativo',
          disponibilidade: true,
        };

        await db.createTecnico(novoTecnico, token);
        toast.success('Técnico cadastrado com sucesso');
      }

      setIsDialogOpen(false);
      carregarTecnicos();
    } catch (error) {
      console.error('Erro ao salvar técnico:', error);
      toast.error('Erro ao salvar as informações do técnico');
    }
  }

  async function excluirTecnico(id: string) {
    if (!confirm('Tem certeza que deseja excluir este técnico?')) return;

    try {
      const session: any = await import('next-auth/react').then(mod => mod.getSession());
      const token = session?.accessToken;

      await db.deleteTecnico(id, token);

      toast.success('Técnico excluído com sucesso');
      carregarTecnicos();
    } catch (error) {
      console.error('Erro ao excluir técnico:', error);
      toast.error('Não foi possível excluir o técnico');
    }
  }

  // Filtrar técnicos com base nos critérios selecionados
  const tecnicosFiltrados = tecnicos.filter(tecnico => {
    const matchesEspecialidade = filtroEspecialidade === 'all' || tecnico.especialidade === filtroEspecialidade;
    const matchesStatus = filtroStatus === 'all' || tecnico.status === filtroStatus;

    let matchesDisponibilidade = true;
    if (filtroDisponibilidade === 'true') {
      matchesDisponibilidade = tecnico.disponibilidade === true;
    } else if (filtroDisponibilidade === 'false') {
      matchesDisponibilidade = tecnico.disponibilidade === false;
    } else if (filtroDisponibilidade === 'online') {
      matchesDisponibilidade = tecnico.is_online === true;
    }

    const matchesPesquisa = searchTerm === '' ||
      tecnico.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tecnico.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEspecialidade && matchesStatus && matchesDisponibilidade && matchesPesquisa;
  });

  const totalTecnicos = tecnicosFiltrados.length;
  const paginatedTecnicos = tecnicosFiltrados.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filtroEspecialidade, filtroStatus, filtroDisponibilidade]);

  // Obter lista única de especialidades para o filtro
  const especialidades = [...new Set(tecnicos.map(t => t.especialidade))].filter(Boolean);

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Gestão de Técnicos</h1>
          <Button onClick={() => abrirFormulario()} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Técnico
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Barra de pesquisa - sempre em linha separada no mobile */}
              <div className="w-full">
                <Label htmlFor="pesquisa" className="text-slate-200">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="pesquisa"
                    type="text"
                    placeholder="Nome ou email do técnico..."
                    className="pl-8 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtros em grid responsivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="especialidade" className="text-slate-200">Especialidade</Label>
                  <Select
                    value={filtroEspecialidade}
                    onValueChange={setFiltroEspecialidade}
                  >
                    <SelectTrigger id="especialidade" className="bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue placeholder="Todas as especialidades" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">Todas as especialidades</SelectItem>
                      {especialidades.filter(esp => esp).map(esp => (
                        <SelectItem key={esp!} value={esp!}>{esp!}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-slate-200">Status</Label>
                  <Select
                    value={filtroStatus}
                    onValueChange={setFiltroStatus}
                  >
                    <SelectTrigger id="status" className="bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="disponibilidade" className="text-slate-200">Disponibilidade</Label>
                  <Select
                    value={filtroDisponibilidade}
                    onValueChange={setFiltroDisponibilidade}
                  >
                    <SelectTrigger id="disponibilidade" className="bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue placeholder="Todas as disponibilidades" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">Todas as disponibilidades</SelectItem>
                      <SelectItem value="true">Disponível</SelectItem>
                      <SelectItem value="false">Indisponível</SelectItem>
                      <SelectItem value="online">Apenas Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Técnicos */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Técnicos ({tecnicosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-slate-400">Carregando técnicos...</div>
            ) : tecnicosFiltrados.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                Nenhum técnico encontrado com os filtros selecionados.
              </div>
            ) : (
              <>
                {/* Tabela para desktop */}
                <div className="hidden xl:block overflow-x-auto">
                  <div className="min-w-full">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[120px]">Nome</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[150px]">Email</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[100px]">Telefone</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[120px]">Especialidade</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[80px]">Status</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[100px]" title="Aceita novos tickets (pode estar offline)">Disponibilidade</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[80px]" title="Ligado à aplicação neste momento">Online</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[80px]">Avaliação</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-300 min-w-[120px]">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTecnicos.map((tecnico) => (
                          <tr key={tecnico.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-2 text-white truncate max-w-[120px]" title={tecnico.name}>{tecnico.name}</td>
                            <td className="py-3 px-2 text-slate-300 truncate max-w-[150px]" title={tecnico.email}>{tecnico.email}</td>
                            <td className="py-3 px-2 text-slate-300 truncate max-w-[100px]">{tecnico.telefone || '-'}</td>
                            <td className="py-3 px-2 text-slate-300 truncate max-w-[120px]" title={tecnico.especialidade || 'Geral'}>{tecnico.especialidade || 'Geral'}</td>
                            <td className="py-3 px-2">
                              <Badge
                                className={`${tecnico.status === 'ativo' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-slate-600/50 text-slate-300 border-slate-500/50'} text-xs`}
                              >
                                {tecnico.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </td>
                            <td className="py-3 px-2" title={tecnico.disponibilidade ? 'Aceita novos tickets' : 'Não aceita novos tickets'}>
                              <Badge
                                className={`${tecnico.disponibilidade ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-600/50 text-slate-300 border-slate-500/50'} text-xs`}
                              >
                                {tecnico.disponibilidade ? 'Disponível' : 'Indisponível'}
                              </Badge>
                            </td>
                            <td className="py-3 px-2" title={tecnico.is_online ? 'Ligado à app agora' : 'Não está ligado à aplicação'}>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${tecnico.is_online ? 'bg-green-400 animate-pulse' : 'bg-slate-600'
                                  }`}></div>
                                <span className="text-xs text-slate-400">
                                  {tecnico.is_online ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {tecnico.avaliacao != null ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium text-white">{Number(tecnico.avaliacao).toFixed(1)}</span>
                                  <span className="text-xs text-slate-500">/5</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirFormulario(tecnico, true)}
                                  title="Visualizar"
                                  className="text-slate-400 hover:text-white hover:bg-slate-600 h-8 w-8 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirFormulario(tecnico)}
                                  title="Editar"
                                  className="text-slate-400 hover:text-white hover:bg-slate-600 h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => excluirTecnico(tecnico.id)}
                                  title="Excluir"
                                  className="text-slate-400 hover:text-red-400 hover:bg-slate-600 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cards para mobile e tablet */}
                <div className="xl:hidden space-y-4">
                  {paginatedTecnicos.map((tecnico) => (
                    <Card key={tecnico.id} className="bg-slate-700/30 border-slate-600/30">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Header com nome e status online */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-lg truncate" title={tecnico.name}>{tecnico.name}</h3>
                              <p className="text-slate-300 text-sm truncate" title={tecnico.email}>{tecnico.email}</p>
                              {tecnico.telefone && (
                                <p className="text-slate-400 text-sm">{tecnico.telefone}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <div className={`w-3 h-3 rounded-full ${tecnico.is_online ? 'bg-green-400 animate-pulse' : 'bg-slate-600'
                                }`}></div>
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {tecnico.is_online ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>

                          {/* Badges e informações */}
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              className={`${tecnico.status === 'ativo' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-slate-600/50 text-slate-300 border-slate-500/50'} text-xs`}
                            >
                              {tecnico.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Badge
                              className={`${tecnico.disponibilidade ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-600/50 text-slate-300 border-slate-500/50'} text-xs`}
                            >
                              {tecnico.disponibilidade ? 'Disponível' : 'Indisponível'}
                            </Badge>
                            {tecnico.especialidade && (
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                {tecnico.especialidade}
                              </Badge>
                            )}
                          </div>

                          {/* Avaliação e última atividade */}
                          <div className="space-y-2 text-sm">
                            {tecnico.avaliacao ? (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">Avaliação:</span>
                                <span className="font-medium text-white">{Number(tecnico.avaliacao).toFixed(1)}</span>
                                <span className="text-slate-500">/5</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Sem avaliação</span>
                            )}

                            {tecnico.last_seen && (
                              <div className="text-slate-500 text-xs">
                                Última atividade: {new Date(tecnico.last_seen).toLocaleTimeString('pt-BR')}
                              </div>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex gap-2 pt-2 border-t border-slate-600/30">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirFormulario(tecnico, true)}
                              title="Visualizar"
                              className="text-slate-400 hover:text-white hover:bg-slate-600 flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirFormulario(tecnico)}
                              title="Editar"
                              className="text-slate-400 hover:text-white hover:bg-slate-600 flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => excluirTecnico(tecnico.id)}
                              title="Excluir"
                              className="text-slate-400 hover:text-red-400 hover:bg-slate-600 flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {totalTecnicos > 0 && (
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={totalTecnicos}
                    onPageChange={setPage}
                    onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
                    label="técnicos"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 mx-4">
          <DialogHeader>
            <DialogTitle className="text-white text-lg sm:text-xl">
              {selectedTecnico
                ? isEditing
                  ? `Visualizar: ${selectedTecnico.name}`
                  : `Editar: ${selectedTecnico.name}`
                : 'Novo Técnico'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome" className="text-slate-200">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isEditing}
                placeholder="Nome completo do técnico"
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditing}
                placeholder="email@exemplo.com"
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="text-slate-200">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                disabled={isEditing}
                placeholder="(00) 00000-0000"
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <Label htmlFor="especialidade" className="text-slate-200">Especialidade</Label>
              <Input
                id="especialidade"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                disabled={isEditing}
                placeholder="Ex: Solar, Baterias, Furo de Água..."
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <Label htmlFor="status-select" className="text-slate-200">Status</Label>
              <Select
                value={status}
                onValueChange={(value: 'ativo' | 'inativo') => setStatus(value)}
                disabled={isEditing}
              >
                <SelectTrigger id="status-select" className="bg-slate-700/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white w-full sm:w-auto"
            >
              {isEditing ? 'Fechar' : 'Cancelar'}
            </Button>

            {!isEditing && (
              <Button onClick={salvarTecnico} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                {selectedTecnico ? 'Atualizar' : 'Cadastrar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
