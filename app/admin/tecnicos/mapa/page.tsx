'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { TecnicosMapView } from '@/components/admin/TecnicosMapView';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function TecnicosMapaPage() {
  const { data: session, status } = useSession();

  // Verifique se o usuário está autenticado e é admin
  if (status === 'loading') {
    return <div>Carregando...</div>;
  }

  if (!session || session.user.type !== 'admin') {
    redirect('/auth/signin');
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Localização dos Técnicos</h1>
          <p className="text-muted-foreground mt-2">
            Monitore a localização em tempo real dos técnicos em campo.
          </p>
        </div>

        <div className="grid gap-6">
          <TecnicosMapView />
        </div>
      </div>
    </AdminLayout>
  );
}
