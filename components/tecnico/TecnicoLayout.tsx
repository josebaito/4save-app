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
  Calendar,
} from 'lucide-react';
import { offlineSync } from '@/lib/offline/sync';
import { toast } from 'sonner';
import { db } from '@/lib/db/supabase';
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
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        const token = (session as any)?.accessToken;
        await db.updateTecnicoOnlineStatus(session.user.id, true, token);
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
        const token = (session as any)?.accessToken;
        db.updateTecnicoOnlineStatus(session.user.id, false, token).catch(console.error);
      }
    };
  }, [session?.user?.id, session?.user?.type, session]);

  const handleSignOut = async () => {
    // Marcar como offline antes de sair
    if (session?.user?.id) {
      const token = (session as any)?.accessToken;
      await db.updateTecnicoOnlineStatus(session.user.id, false, token).catch(console.error);
    }
    await signOut({ callbackUrl: '/', redirect: true });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Sem conexão com a internet');
      return;
    }

    setSyncing(true);

    try {
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
      <div className="flex h-screen w-full overflow-hidden bg-slate-900">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[90] bg-black/80 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed on Mobile, Static on Desktop but inside flex container */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-[100] flex w-72 flex-col bg-slate-800 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-slate-700/50',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
          )}
        >
          {/* Sidebar Header */}
          <div className={cn(
            "flex h-16 items-center border-b border-slate-700/50",
            sidebarCollapsed ? "justify-center" : "justify-between px-6"
          )}>
            {!sidebarCollapsed && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">4Save Técnico</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex text-slate-400 hover:text-white hover:bg-slate-700/50"
              onClick={toggleSidebar}
            >
              <Menu className="h-4 w-4" />
            </Button>
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
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative',
                    isActive
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
                    sidebarCollapsed ? 'justify-center' : ''
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                      sidebarCollapsed ? '' : 'mr-3'
                    )}
                  />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions Footer (Sync) */}
          <div className={cn(
            "border-t border-slate-700/50 p-4 space-y-2 bg-slate-800/50",
            sidebarCollapsed ? "px-2 items-center flex flex-col" : ""
          )}>
            {/* Status de Sincronização */}
            {!sidebarCollapsed && syncStatus.hasPendingData && (
              <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">
                    {syncStatus.pendingCount} pendente(s)
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className={cn(
                "w-full text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white transition-colors",
                sidebarCollapsed ? "h-10 w-10 p-0 justify-center" : "justify-start"
              )}
              disabled={syncing || !isOnline}
              title={sidebarCollapsed ? (syncing ? 'Sincronizando...' : isOnline ? 'Sincronizar' : 'Offline') : undefined}
            >
              {syncing ? (
                <RefreshCw className={cn("h-4 w-4 animate-spin", !sidebarCollapsed && "mr-2")} />
              ) : isOnline ? (
                <Wifi className={cn("h-4 w-4 text-green-400", !sidebarCollapsed && "mr-2")} />
              ) : (
                <WifiOff className={cn("h-4 w-4 text-red-400", !sidebarCollapsed && "mr-2")} />
              )}
              {!sidebarCollapsed && (syncing ? 'Sincronizando...' : isOnline ? 'Sincronizar' : 'Offline')}
            </Button>

            {/* Última sincronização */}
            {!sidebarCollapsed && syncStatus.lastSync && (
              <p className="text-[10px] text-slate-500 text-center">
                Última: {new Date(syncStatus.lastSync).toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
        </aside>

        {/* Main Content Wrapper */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-slate-900">
          {/* Top Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-700/50 bg-slate-800/50 px-4 lg:px-8 backdrop-blur-sm shrink-0">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-4 text-slate-400 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-200">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-blue-500/20">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200 leading-none">{session?.user?.name}</span>
                  <span className="text-[10px] text-slate-500 leading-none mt-0.5">{session?.user?.email}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Localização em tempo real Container - Keeping it somewhat fluid in the layout */}
              <div className="mb-6">
                <LocationTracker />
              </div>

              {children}
            </div>

            {/* Footer inside scroll area or separate? AdminLayout didn't have one, but Tecnico did. Let's keep it simple at the bottom of content. */}
            <div className="mt-8 pt-4 border-t border-slate-800/50 flex justify-center pb-4">
              <span className="text-xs text-slate-500">
                © 2024 4Save - Sistema de Gestão Técnico
              </span>
            </div>
          </main>
        </div>
      </div>
    </AdminTheme>
  );
}