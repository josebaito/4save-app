'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';
import { Shield, User } from 'lucide-react';

interface ProfileFormState {
  name: string;
  email: string;
  telefone: string;
  especialidade: string;
  type: string;
  last_seen?: string;
  is_online?: boolean;
}

export default function AdminPerfilPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    name: '',
    email: '',
    telefone: '',
    especialidade: '',
    type: 'admin',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const sessionOnline = status === 'authenticated';

  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status]);

  const loadProfile = async () => {
    if (!(session as any)?.accessToken || !session?.user?.id) return;

    setLoading(true);
    try {
      const token = (session as any).accessToken;
      const user = await db.getTecnicoById(session.user.id, token);
      if (user) {
        setForm({
          name: user.name || '',
          email: user.email || '',
          telefone: user.telefone || '',
          especialidade: user.especialidade || '',
          type: user.type || 'admin',
          last_seen: user.last_seen,
          is_online: user.is_online,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!(session as any)?.accessToken || !session?.user?.id) return;

    setSaving(true);
    try {
      const token = (session as any).accessToken;
      await db.updateTecnico(session.user.id, {
        name: form.name,
        telefone: form.telefone,
        especialidade: form.especialidade,
      }, token);
      toast.success('Perfil atualizado com sucesso');
      loadProfile();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!(session as any)?.accessToken || !session?.user?.id) return;

    if (newPassword.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setPasswordSaving(true);
    try {
      const token = (session as any).accessToken;
      await db.updateTecnico(session.user.id, { password: newPassword }, token);
      toast.success('Senha atualizada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground">Gerir informações pessoais e segurança</p>
          </div>
          <Badge variant="outline" className="w-fit flex items-center gap-1.5 px-3 py-1.5 text-sm border-primary/30 text-primary">
            <Shield className="h-3.5 w-3.5" />
            Administrador
          </Badge>
        </div>

        {/* Avatar + Info rápida */}
        {!loading && (
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-orange-300 flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg leading-tight">{form.name || '—'}</p>
                  <p className="text-sm text-muted-foreground">{form.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`status-dot ${sessionOnline ? 'status-dot-online' : 'status-dot-offline'}`} />
                    <span className="text-xs text-muted-foreground">{sessionOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações pessoais */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                A carregar...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={form.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Input
                    id="especialidade"
                    value={form.especialidade}
                    onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {saving ? 'A guardar...' : 'Guardar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Palavra-passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handlePasswordChange} disabled={passwordSaving} variant="outline">
                {passwordSaving ? 'A actualizar...' : 'Actualizar Palavra-passe'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
