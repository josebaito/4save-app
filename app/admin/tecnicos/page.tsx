'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';
import { Search, UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import type { User } from '@/types';
import { createSupabaseClient } from '@/lib/db/supabase';

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

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [disponibilidade, setDisponibilidade] = useState(true);

  useEffect(() => {
    carregarTecnicos();
  }, []);

  async function carregarTecnicos() {
    setLoading(true);
    try {
      // Usar a função getTecnicos do cliente db
      const tecnicos = await db.getTecnicos();
      
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
    setDisponibilidade(true);
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
      setDisponibilidade(tecnico.disponibilidade ?? true);
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
      if (selectedTecnico) {
        // Atualizar técnico existente
        await db.updateTecnico(selectedTecnico.id, {
          name: nome,
          email: email,
          telefone: telefone || undefined,
          especialidade: especialidade || undefined,
          status: status || 'ativo',
          disponibilidade: disponibilidade !== undefined ? disponibilidade : true,
          avaliacao: 0 // Avaliação é resetada para 0 ao editar
        });
        
        toast.success('Técnico atualizado com sucesso');
      } else {
        // Criar novo técnico
        const supabase = createSupabaseClient();
        const { error } = await supabase
          .from('users')
          .insert([{
            id: crypto.randomUUID(),
            name: nome,
            email: email,
            password: 'tecnico123', // Senha padrão
            type: 'tecnico',
            telefone: telefone || null,
            especialidade: especialidade || null,
            status: status || 'ativo',
            disponibilidade: disponibilidade !== undefined ? disponibilidade : true,
            avaliacao: 0,
            localizacao_gps: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) {
          console.error('Erro detalhado:', error);
          throw error;
        }
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
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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

  // Obter lista única de especialidades para o filtro
  const especialidades = [...new Set(tecnicos.map(t => t.especialidade))].filter(Boolean);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestão de Técnicos</h1>
          <Button onClick={() => abrirFormulario()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Técnico
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="pesquisa">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="pesquisa"
                    type="text"
                    placeholder="Nome ou email do técnico..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full md:w-64">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Select 
                  value={filtroEspecialidade} 
                  onValueChange={setFiltroEspecialidade}
                >
                  <SelectTrigger id="especialidade">
                    <SelectValue placeholder="Todas as especialidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as especialidades</SelectItem>
                    {especialidades.filter(esp => esp).map(esp => (
                      <SelectItem key={esp!} value={esp!}>{esp!}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-48">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={filtroStatus} 
                  onValueChange={setFiltroStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="disponibilidade">Disponibilidade</Label>
                <Select 
                  value={filtroDisponibilidade} 
                  onValueChange={setFiltroDisponibilidade}
                >
                  <SelectTrigger id="disponibilidade">
                    <SelectValue placeholder="Todas as disponibilidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disponibilidades</SelectItem>
                    <SelectItem value="true">Disponível</SelectItem>
                    <SelectItem value="false">Indisponível</SelectItem>
                    <SelectItem value="online">Apenas Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Técnicos */}
        <Card>
          <CardHeader>
            <CardTitle>Técnicos ({tecnicosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Carregando técnicos...</div>
            ) : tecnicosFiltrados.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum técnico encontrado com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Telefone</th>
                      <th className="text-left py-3 px-4 font-medium">Especialidade</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Disponibilidade</th>
                      <th className="text-left py-3 px-4 font-medium">Online</th>
                      <th className="text-left py-3 px-4 font-medium">Avaliação</th>
                      <th className="text-left py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tecnicosFiltrados.map((tecnico) => (
                      <tr key={tecnico.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{tecnico.name}</td>
                        <td className="py-3 px-4">{tecnico.email}</td>
                        <td className="py-3 px-4">{tecnico.telefone || '-'}</td>
                        <td className="py-3 px-4">{tecnico.especialidade || 'Geral'}</td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={tecnico.status === 'ativo' ? 'default' : 'secondary'}
                          >
                            {tecnico.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={tecnico.disponibilidade ? 'default' : 'secondary'}
                          >
                            {tecnico.disponibilidade ? 'Disponível' : 'Indisponível'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              tecnico.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-xs text-gray-600">
                              {tecnico.is_online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          {tecnico.last_seen && (
                            <p className="text-xs text-gray-400 mt-1">
                              Última atividade: {new Date(tecnico.last_seen).toLocaleTimeString('pt-BR')}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {tecnico.avaliacao ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">{tecnico.avaliacao.toFixed(1)}</span>
                              <span className="text-xs text-gray-500">/5</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Sem avaliação</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => abrirFormulario(tecnico, true)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => abrirFormulario(tecnico)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => excluirTecnico(tecnico.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTecnico 
                ? isEditing 
                  ? `Visualizar Técnico: ${selectedTecnico.name}` 
                  : `Editar Técnico: ${selectedTecnico.name}`
                : 'Cadastrar Novo Técnico'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input 
                id="nome" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                disabled={isEditing}
                placeholder="Nome completo do técnico"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={isEditing}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input 
                id="telefone" 
                value={telefone} 
                onChange={(e) => setTelefone(e.target.value)} 
                disabled={isEditing}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div>
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                disabled={isEditing}
                placeholder="Ex: Solar, Baterias, Furo de Água..."
              />
            </div>
            
            <div>
              <Label htmlFor="status-select">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value: 'ativo' | 'inativo') => setStatus(value)} 
                disabled={isEditing}
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="disponibilidade">Disponibilidade</Label>
              <Select 
                value={disponibilidade ? 'true' : 'false'} 
                onValueChange={(value: 'true' | 'false') => setDisponibilidade(value === 'true')} 
                disabled={isEditing}
              >
                <SelectTrigger id="disponibilidade">
                  <SelectValue placeholder="Disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Disponível</SelectItem>
                  <SelectItem value="false">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              {isEditing ? 'Fechar' : 'Cancelar'}
            </Button>
            
            {!isEditing && (
              <Button onClick={salvarTecnico}>
                {selectedTecnico ? 'Atualizar' : 'Cadastrar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
