'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ModernTecnicosMapView } from '@/components/admin/ModernTecnicosMapView';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function TecnicosMapaPage() {
  const { data: session, status } = useSession();

  // Verifique se o usuário está autenticado e é admin
  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-slate-400">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!session || session.user.type !== 'admin') {
    redirect('/auth/signin');
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Localização dos Técnicos</h1>
          <p className="text-slate-400 mt-2">
            Monitore a localização em tempo real dos técnicos em campo com tecnologia avançada de rastreamento.
          </p>
        </div>

        <ModernTecnicosMapView />
      </div>
    </AdminLayout>
  );
}
