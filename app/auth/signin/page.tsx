'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
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
    <div className="dark min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-6 border border-border shadow-sm">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight mb-2">
            Acesso Técnico
          </h1>
          <p className="text-muted-foreground font-body">
            Entre com suas credenciais para acessar o painel.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none transition-all font-mono text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none transition-all font-mono text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-11 font-medium transition-all group mt-6"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Sistema 4Save PRO v2.0
          </p>
        </div>
      </div>
    </div>
  );
}