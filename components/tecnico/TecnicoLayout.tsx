'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  FileText,
  Menu,
  X,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  // User,
  Calendar,
  // MapPin
} from 'lucide-react';
import { offlineSync } from '@/lib/offline/sync';
import { toast } from 'sonner';
import { db } from '@/lib/db/supabase';
// import { useRouter } from 'next/navigation';
import { LocationTracker } from './LocationTracker';
import { AdminTheme } from '../admin/AdminTheme';

interface TecnicoLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/tecnico', icon: Home },
  { name: 'Meus Tickets', href: '/tecnico/tickets', icon: FileText },
  { name: 'Manutenções', href: '/tecnico/manutencao', icon: Calendar },
];

export function TecnicoLayout({ children }: TecnicoLayoutProps) {
  const { data: session } = useSession();
  // const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    pendingCount: number;
    lastSync: string;
    isOnline: boolean;
    hasPendingData: boolean;
  }>({
    pendingCount: 0,
    lastSync: '',
    isOnline: true,
    hasPendingData: false
  });

  // Verificar status online
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      // Atualizar status de sincronização
      const status = offlineSync.getSyncStatus();
      setSyncStatus(status);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Atualizar status de sincronização periodicamente
  useEffect(() => {
    const updateSyncStatus = () => {
      const status = offlineSync.getSyncStatus();
      setSyncStatus(status);
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Sistema de heartbeat otimizado para manter status online
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== 'tecnico') return;
    
    let heartbeatCount = 0;
    const heartbeat = async () => {
      try {
        await db.updateTecnicoOnlineStatus(session.user.id, true);
        heartbeatCount++;
        
        // Log a cada heartbeat para debug
        console.log(`Heartbeat #${heartbeatCount} - Técnico online`);
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    };
    
    // Primeiro heartbeat imediato
    heartbeat();
    
    // Heartbeat a cada 30 segundos
    const interval = setInterval(heartbeat, 30000);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      // Marcar como offline quando sair
      if (session?.user?.id) {
        db.updateTecnicoOnlineStatus(session.user.id, false).catch(console.error);
      }
    };
  }, [session?.user?.id, session?.user?.type]);

  const handleSignOut = () => {
    // Marcar como offline antes de sair
    if (session?.user?.id) {
      db.updateTecnicoOnlineStatus(session.user.id, false).catch(console.error);
    }
    signOut({ callbackUrl: '/' });
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Sem conexão com a internet');
      return;
    }

    setSyncing(true);
    
    try {
      // ✅ MELHORIA: Usar sincronização real
      const result = await offlineSync.syncPendingData();
      
      if (result.synced === 0) {
        toast.info('Nenhum dado pendente para sincronizar');
      } else {
        toast.success(result.message);
      }
      
      // Recarregar dados apenas se houve sincronização
      if (result.synced > 0) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Erro na sincronização: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminTheme>
      <div className="min-h-screen bg-slate-900 lg:flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">4Save Técnico</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-white' : 'text-slate-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="px-4 py-4 border-t border-slate-700 space-y-2">
            {/* Status de Sincronização */}
            {syncStatus.hasPendingData && (
              <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">
                    {syncStatus.pendingCount} item(s) pendente(s)
                  </span>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className="w-full justify-start text-slate-300 border-slate-600 hover:bg-slate-700"
              disabled={syncing || !isOnline}
            >
              {syncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : isOnline ? (
                <Wifi className="mr-2 h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="mr-2 h-4 w-4 text-red-400" />
              )}
              {syncing ? 'Sincronizando...' : isOnline ? 'Sincronizar' : 'Offline'}
            </Button>
            
            {/* Última sincronização */}
            {syncStatus.lastSync && (
              <p className="text-xs text-slate-500 text-center">
                Última sincronização: {new Date(syncStatus.lastSync).toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-t border-slate-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-slate-400">{session?.user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full mt-3 justify-start text-slate-300 hover:text-red-400 hover:bg-slate-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:flex lg:flex-col">
        {/* Top bar - apenas mobile menu */}
        <div className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 px-4 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-white">
              {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h1>
            <div></div>
          </div>
        </div>

        {/* Localização em tempo real */}
        <div className="px-4 pb-4">
          <LocationTracker />
        </div>
          
        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 bg-slate-900">
          {children}
        </main>
      </div>
    </div>
    </AdminTheme>
  );
}