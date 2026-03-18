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
        toast.error('Erro de autenticação');
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
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gira os clientes do sistema</p>
          </div>
          <Button onClick={handleNewClient} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou NIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Clientes ({filteredClientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredClientes.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-secondary/40 rounded-xl hover:bg-secondary/60 transition-colors border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{cliente.nome}</h4>
                      <p className="text-sm text-muted-foreground truncate">{cliente.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.telefone}{cliente.cnpj ? ` • ${cliente.cnpj}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1 truncate">{cliente.endereco}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="muted" className="hidden sm:inline-flex">
                        {new Date(cliente.created_at).toLocaleDateString('pt-PT')}
                      </Badge>
                      <span className="text-xs text-muted-foreground/60 sm:hidden">
                        {new Date(cliente.created_at).toLocaleDateString('pt-PT')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(cliente)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cliente)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                        title="Editar"
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
              <div className="text-center py-8 text-muted-foreground/70">
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto border-border mx-4">
            <DialogHeader>
              <DialogTitle className="text-foreground text-lg sm:text-xl">
                {isEditing ? 'Editar Cliente' : selectedCliente ? 'Detalhes do Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-foreground/80">Nome / Razão Social</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedCliente}
                    placeholder="Nome completo ou razão social"
                    className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedCliente}
                    placeholder="email@exemplo.com"
                    className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-foreground/80">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    required
                    disabled={!isEditing && !!selectedCliente}
                    placeholder="+351 900 000 000"
                    className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-foreground/80">NIF</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    disabled={!isEditing && !!selectedCliente}
                    placeholder="000 000 000"
                    className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-foreground/80">Morada</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                  disabled={!isEditing && !!selectedCliente}
                  placeholder="Rua, número, cidade, código postal"
                  className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
              {(isEditing || !selectedCliente) && (
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
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
