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
  User,
} from 'lucide-react';
import { offlineSync } from '@/lib/offline/sync';
import { toast } from 'sonner';
import { db } from '@/lib/db/supabase';
import { LocationTracker } from './LocationTracker';
import { AdminTheme } from '../admin/AdminTheme';
import { ThemeToggle } from '@/components/ThemeToggle';

interface TecnicoLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/tecnico', icon: Home },
  { name: 'Meus Tickets', href: '/tecnico/tickets', icon: FileText },
  { name: 'Manutenções', href: '/tecnico/manutencao', icon: Calendar },
  { name: 'Perfil', href: '/tecnico/perfil', icon: User },
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

  useEffect(() => {
    const updateOnlineStatus = async () => {
      const online = navigator.onLine;
      setIsOnline(online);
      const status = await offlineSync.getSyncStatus();
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

  useEffect(() => {
    const updateSyncStatus = async () => {
      const status = await offlineSync.getSyncStatus();
      setSyncStatus(status);
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!session?.user?.id || session.user.type !== 'tecnico') return;

    let heartbeatCount = 0;
    const heartbeat = async () => {
      try {
        const currentSession: any = await import('next-auth/react').then((mod) => mod.getSession());
        const token = currentSession?.accessToken;
        const userId = currentSession?.user?.id;
        if (!token || !userId) return;
        await db.updateTecnicoOnlineStatus(userId, true, token);
        heartbeatCount++;
        console.log(`Heartbeat #${heartbeatCount} - Técnico online`);
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    };

    heartbeat();

    const interval = setInterval(heartbeat, 30000);

    return () => {
      clearInterval(interval);
      (async () => {
        try {
          const currentSession: any = await import('next-auth/react').then((mod) => mod.getSession());
          const token = currentSession?.accessToken;
          const userId = currentSession?.user?.id;
          if (userId && token) {
            await db.updateTecnicoOnlineStatus(userId, false, token);
          }
        } catch (e) {
          console.error('Erro ao marcar offline:', e);
        }
      })();
    };
  }, [session?.user?.id, session?.user?.type]);

  const handleSignOut = async () => {
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
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[90] bg-black/80 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-[100] flex w-72 flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-border',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
          )}
        >
          <div
            className={cn(
              'flex h-16 items-center border-b border-border',
              sidebarCollapsed ? 'justify-center' : 'justify-between px-6'
            )}
          >
            {!sidebarCollapsed && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-orange-300 bg-clip-text text-transparent">
                4Save Técnico
              </h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex text-muted-foreground hover:text-foreground"
              onClick={toggleSidebar}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

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
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                    sidebarCollapsed ? 'justify-center' : ''
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      sidebarCollapsed ? '' : 'mr-3'
                    )}
                  />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          <div
            className={cn(
              'border-t border-border p-4 space-y-2 bg-card',
              sidebarCollapsed ? 'px-2 items-center flex flex-col' : ''
            )}
          >
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
                'w-full',
                sidebarCollapsed ? 'h-10 w-10 p-0 justify-center' : 'justify-start'
              )}
              disabled={syncing || !isOnline}
              title={sidebarCollapsed ? (syncing ? 'Sincronizando...' : isOnline ? 'Sincronizar' : 'Offline') : undefined}
            >
              {syncing ? (
                <RefreshCw className={cn('h-4 w-4 animate-spin', !sidebarCollapsed && 'mr-2')} />
              ) : isOnline ? (
                <Wifi className={cn('h-4 w-4 text-emerald-400', !sidebarCollapsed && 'mr-2')} />
              ) : (
                <WifiOff className={cn('h-4 w-4 text-rose-400', !sidebarCollapsed && 'mr-2')} />
              )}
              {!sidebarCollapsed && (syncing ? 'Sincronizando...' : isOnline ? 'Sincronizar' : 'Offline')}
            </Button>

            {!sidebarCollapsed && syncStatus.lastSync && (
              <p className="text-[10px] text-muted-foreground text-center">
                Última: {new Date(syncStatus.lastSync).toLocaleTimeString('pt-BR')}
              </p>
            )}

            <ThemeToggle collapsed={sidebarCollapsed} />
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-background">
          <header className="flex h-16 items-center justify-between border-b border-border bg-card/70 px-4 lg:px-8 backdrop-blur-sm shrink-0">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-4 text-muted-foreground lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">
                {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-card border border-border">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary to-orange-300 flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-lg">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground leading-none">{session?.user?.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{session?.user?.email}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <LocationTracker />
              </div>

              {children}
            </div>

            <div className="mt-8 pt-4 border-t border-border flex justify-center pb-4">
              <span className="text-xs text-muted-foreground">
                © 2024 4Save - Sistema de Gestão Técnico
              </span>
            </div>
          </main>
        </div>
      </div>
    </AdminTheme>
  );
}
