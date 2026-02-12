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
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { db } from '@/lib/db/supabase';
import { Pagination } from '@/components/ui/pagination';
import type { Cliente } from '@/types';
import { toast } from 'sonner';

export default function ClientesPage() {
  const { data: session, status } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cnpj: ''
  });

  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.accessToken) {
      loadClientes();
    }
  }, [status, session]);

  const loadClientes = async () => {
    if (!(session as any)?.accessToken) return;
    try {
      const token = (session as any).accessToken;
      const data = await db.getClientes(token);
      setClientes(data);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClientes = filteredClientes.length;
  const paginatedClientes = filteredClientes.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!(session as any)?.accessToken) {
        toast.error('Erro de autenticaÃ§Ã£o');
        return;
      }
      if (isEditing && selectedCliente) {
        await db.updateCliente(selectedCliente.id, formData, (session as any).accessToken);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await db.createCliente(formData, (session as any).accessToken);
        toast.success('Cliente criado com sucesso!');
      }
      
      await loadClientes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      cnpj: ''
    });
    setSelectedCliente(null);
    setIsEditing(false);
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      cnpj: cliente.cnpj || ''
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleView = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      cnpj: cliente.cnpj || ''
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleNewClient = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Clientes</h1>
            <p className="text-slate-400">Gerencie os clientes do sistema</p>
          </div>
          <Button onClick={handleNewClient} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">
              Clientes ({filteredClientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : filteredClientes.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{cliente.nome}</h4>
                      <p className="text-sm text-slate-300">{cliente.email}</p>
                      <p className="text-sm text-slate-400">
                        {cliente.telefone} • {cliente.cnpj || 'CPF'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{cliente.endereco}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-600/50 text-slate-300 border-slate-500/50">
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(cliente)}
                        className="text-slate-400 hover:text-white hover:bg-slate-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cliente)}
                        className="text-slate-400 hover:text-white hover:bg-slate-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
                {totalClientes > 0 && (
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={totalClientes}
                    onPageChange={setPage}
                    onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
                    label="clientes"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-slate-400">Nenhum cliente encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {isEditing ? 'Editar Cliente' : selectedCliente ? 'Detalhes do Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-slate-200">Nome/Razão Social</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedCliente}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedCliente}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-slate-200">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedCliente}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-slate-200">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    disabled={!isEditing && !!selectedCliente}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-slate-200">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                  disabled={!isEditing && !!selectedCliente}
                  className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>
              {(isEditing || !selectedCliente) && (
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
