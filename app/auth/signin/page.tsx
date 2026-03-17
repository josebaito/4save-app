'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Loader2, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Credenciais inválidas');
        setLoading(false);
      } else {
        toast.success('Login realizado com sucesso!');
        router.push('/admin'); // Or check role to redirect correctly
        router.refresh();
      }
    } catch (error) {
      toast.error('Erro ao realizar login');
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex bg-background">

      {/* Painel Esquerdo — Marca */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-card border-r border-border">
        {/* Fundo com padrão */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04] pointer-events-none" />

        {/* Gradiente decorativo */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        {/* Linha superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 border border-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">4Save</span>
          </div>

          {/* Conteúdo central */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono font-medium text-primary uppercase tracking-wider">Sistema Activo</span>
              </div>
              <h1 className="text-5xl font-heading font-bold text-foreground leading-tight tracking-tight">
                Gestão Técnica<br />
                <span className="text-primary">Profissional</span>
              </h1>
              <p className="text-lg text-muted-foreground font-body leading-relaxed max-w-md">
                Plataforma integrada de gestão de tickets, manutenções e relatórios técnicos para equipas de campo.
              </p>
            </div>

            {/* Funcionalidades */}
            <div className="space-y-4">
              {[
                { icon: CheckCircle2, texto: 'Gestão completa de tickets e ordens de serviço' },
                { icon: CheckCircle2, texto: 'Relatórios técnicos com fotos, vídeos e assinatura digital' },
                { icon: CheckCircle2, texto: 'Monitorização em tempo real de técnicos de campo' },
                { icon: CheckCircle2, texto: 'Planos de manutenção preventiva e correctiva' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground font-body">{item.texto}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Acesso protegido por autenticação segura</span>
          </div>
        </div>
      </div>

      {/* Painel Direito — Formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Padrão de fundo (mobile) */}
        <div className="lg:hidden absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        <div className="lg:hidden absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo (mobile apenas) */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">4Save</span>
            </div>
          </div>

          {/* Cabeçalho do formulário */}
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-foreground tracking-tight mb-1.5">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-muted-foreground font-body">
              Entre com as suas credenciais para aceder ao sistema
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                Endereço de Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/60 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all font-body text-sm text-foreground placeholder:text-muted-foreground/60"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                Palavra-passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/60 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all font-body text-sm text-foreground placeholder:text-muted-foreground/60"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-lg font-medium transition-all group mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A verificar...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Versão */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              4Save PRO v2.0 &mdash; Sistema de Gestão Técnica
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
