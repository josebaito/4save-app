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
  User,
  Calendar,
  MapPin
} from 'lucide-react';
import { offlineSync } from '@/lib/offline/sync';
import { toast } from 'sonner';
import { db } from '@/lib/db/supabase';
import { useRouter } from 'next/navigation';
import { LocationTracker } from './LocationTracker';

interface TecnicoLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/tecnico', icon: Home },
  { name: 'Meus Tickets', href: '/tecnico/tickets', icon: FileText },
  { name: 'Manutenções', href: '/tecnico/manutencao', icon: Calendar },
];

export function TecnicoLayout({ children }: TecnicoLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  // Sistema de heartbeat para manter status online
  useEffect(() => {
    if (!session?.user?.id || session.user.type !== 'tecnico') return;
    
    const heartbeat = async () => {
      try {
        await db.updateTecnicoOnlineStatus(session.user.id, true);
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
  }, [session?.user?.id]);

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
    <div className="min-h-screen bg-gray-50 lg:flex">
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
          'fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">4Save Técnico</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-2">
            {/* Status de Sincronização */}
            {syncStatus.hasPendingData && (
              <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
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
              className="w-full justify-start"
              disabled={syncing || !isOnline}
            >
              {syncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : isOnline ? (
                <Wifi className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="mr-2 h-4 w-4 text-red-600" />
              )}
              {syncing ? 'Sincronizando...' : isOnline ? 'Sincronizar' : 'Offline'}
            </Button>
            
            {/* Última sincronização */}
            {syncStatus.lastSync && (
              <p className="text-xs text-gray-500 text-center">
                Última sincronização: {new Date(syncStatus.lastSync).toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full mt-3 justify-start text-gray-600 hover:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:flex lg:flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="hidden lg:block">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                Olá, {session?.user?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                {session?.user?.name}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-xs text-gray-600">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {syncing && (
                <div className="flex items-center gap-1 text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Sincronizando...</span>
                </div>
              )}
              
              {syncStatus.hasPendingData && !syncing && (
                <div className="flex items-center gap-1 text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">{syncStatus.pendingCount} pendente(s)</span>
                </div>
              )}
              
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Localização em tempo real */}
        <div className="px-4 pb-4">
          <LocationTracker />
        </div>
          
        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}