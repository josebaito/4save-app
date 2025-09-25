'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TecnicoLayout } from '@/components/tecnico/TecnicoLayout';
import { CalendarioManutencao } from '@/components/tecnico/CalendarioManutencao';
import { NotificacoesManutencao } from '@/components/tecnico/NotificacoesManutencao';
import { HistoricoManutencao } from '@/components/tecnico/HistoricoManutencao';
import { EstatisticasManutencao } from '@/components/tecnico/EstatisticasManutencao';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Bell, CheckCircle } from 'lucide-react';

export default function ManutencaoTecnicoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.type !== 'tecnico') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <TecnicoLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-slate-400">Carregando...</p>
          </div>
        </div>
      </TecnicoLayout>
    );
  }

  return (
    <TecnicoLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white">Manutenções</h1>
        </div>
        
        <div className="mb-6">
          <EstatisticasManutencao />
        </div>
        
        <Tabs defaultValue="calendario" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendario" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendario" className="space-y-4 mt-4">
            <CalendarioManutencao />
          </TabsContent>
          
          <TabsContent value="notificacoes" className="space-y-4 mt-4">
            <NotificacoesManutencao />
          </TabsContent>
          
          <TabsContent value="historico" className="space-y-4 mt-4">
            <HistoricoManutencao />
          </TabsContent>
        </Tabs>
      </div>
    </TecnicoLayout>
  );
}