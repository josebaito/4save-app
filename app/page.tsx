'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Redirecionar baseado no tipo de usuário
    if (session.user?.type === 'admin') {
      router.push('/admin');
    } else if (session.user?.type === 'tecnico') {
      router.push('/tecnico');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-center text-primary">4Save</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-96 border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-primary">4Save</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Redirecionando...</p>
        </CardContent>
      </Card>
    </div>
  );
}
