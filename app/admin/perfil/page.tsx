'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/db/supabase';
import { toast } from 'sonner';

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Atualize suas informações e segurança</p>
        </div>

        <Card className="bg-card/70 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Input value={form.type} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={form.is_online ? 'Online' : 'Offline'} disabled />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePasswordChange} disabled={passwordSaving}>
                {passwordSaving ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
