'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, 
  LogIn, 
  Shield,
  CheckCircle,
  Users,
  BarChart3,
  Smartphone
} from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Credenciais inválidas', {
          description: 'Verifique seu email e senha e tente novamente.',
        });
      } else {
        toast.success('Login realizado com sucesso!');
        
        // Obter session para redirecionar corretamente
        const session = await getSession();
        if (session?.user?.type === 'admin') {
          router.push('/admin');
        } else if (session?.user?.type === 'tecnico') {
          router.push('/tecnico');
        }
      }
    } catch {
      toast.error('Erro no login', {
        description: 'Ocorreu um erro inesperado. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                4Save
              </h1>
              <p className="text-slate-400 text-sm">
                Plataforma Inteligente de Gestão Técnica
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {/* Benefícios Compactos */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex flex-col items-center p-2 rounded-lg bg-slate-700/20 border border-slate-600/20">
                <Users className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-xs text-slate-300 text-center">Gestão</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-slate-700/20 border border-slate-600/20">
                <BarChart3 className="w-4 h-4 text-green-400 mb-1" />
                <span className="text-xs text-slate-300 text-center">Relatórios</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-slate-700/20 border border-slate-600/20">
                <Smartphone className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-xs text-slate-300 text-center">Mobile</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200 font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Entrar
              </Button>
            </form>
            
            <div className="text-center pt-2 border-t border-slate-700/30">
              <div className="flex items-center justify-center space-x-1 text-xs text-slate-500">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>Plataforma escalável e segura</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 