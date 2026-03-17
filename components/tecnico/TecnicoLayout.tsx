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
  Zap,
  ChevronLeft,
  ChevronRight,
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

  const currentPage = navigation.find((item) => item.href === pathname)?.name || 'Dashboard';

  return (
    <AdminTheme>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[90] bg-black/60 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-[100] flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72',
            sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-72'
          )}
        >
          {/* Logo */}
          <div
            className={cn(
              'flex h-16 items-center border-b border-sidebar-border shrink-0',
              sidebarCollapsed ? 'justify-center px-0' : 'px-5 justify-between'
            )}
          >
            {!sidebarCollapsed && (
              <Link href="/tecnico" className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-heading font-bold text-sidebar-foreground leading-none">4Save</span>
                  <span className="text-[10px] font-mono text-sidebar-foreground/40 leading-none mt-0.5 uppercase tracking-wider">Técnico</span>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/20">
                <Zap className="w-4 h-4 text-primary" />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex h-8 w-8 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navegação */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group relative',
                    isActive
                      ? 'bg-primary/12 text-primary'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                    sidebarCollapsed ? 'justify-center' : ''
                  )}
                  onClick={() => { setSidebarOpen(false); }}
                  title={item.name}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground',
                      !sidebarCollapsed && 'mr-3'
                    )}
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Rodapé da sidebar */}
          <div className={cn(
            'border-t border-sidebar-border p-3 space-y-2 shrink-0',
            sidebarCollapsed && 'flex flex-col items-center'
          )}>
            {/* Dados pendentes */}
            {!sidebarCollapsed && syncStatus.hasPendingData && (
              <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                  <span className="text-xs font-medium text-amber-500">
                    {syncStatus.pendingCount} pendente(s) por sincronizar
                  </span>
                </div>
              </div>
            )}

            {/* Info do utilizador */}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/60">
                <div className="relative shrink-0">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary to-orange-300 flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-sidebar rounded-full',
                    isOnline ? 'bg-emerald-400' : 'bg-red-400'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate leading-none">{session?.user?.name}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate leading-none mt-0.5">{session?.user?.email}</p>
                </div>
              </div>
            )}

            {/* Acções */}
            <div
              className={cn(
                sidebarCollapsed
                  ? 'flex flex-col items-center gap-1'
                  : 'grid grid-cols-2 gap-1.5'
              )}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                className={cn(
                  'border-sidebar-border bg-transparent hover:bg-sidebar-accent transition-colors rounded-lg',
                  sidebarCollapsed ? 'h-9 w-9 p-0 justify-center' : 'col-span-2 justify-start gap-2 min-w-0'
                )}
                disabled={syncing || !isOnline}
                title={sidebarCollapsed ? (syncing ? 'A sincronizar...' : isOnline ? 'Sincronizar' : 'Sem ligação') : undefined}
              >
                {syncing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                ) : isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-red-400 shrink-0" />
                )}
                {!sidebarCollapsed && (
                  <span className="text-xs text-muted-foreground truncate">
                    {syncing ? 'A sincronizar...' : isOnline ? 'Sincronizar' : 'Sem ligação'}
                  </span>
                )}
              </Button>
              <ThemeToggle
                collapsed={sidebarCollapsed}
                className={cn(!sidebarCollapsed && 'w-full')}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={cn(
                  'text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg',
                  sidebarCollapsed ? 'h-9 w-9 p-0' : 'w-full h-9 px-3 justify-start gap-2 min-w-0'
                )}
                title={sidebarCollapsed ? 'Sair' : undefined}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                {!sidebarCollapsed && <span className="text-xs truncate">Sair</span>}
              </Button>
            </div>

            {!sidebarCollapsed && syncStatus.lastSync && (
              <p className="text-[10px] text-sidebar-foreground/30 text-center font-mono">
                Última sincronização: {new Date(syncStatus.lastSync).toLocaleTimeString('pt-PT')}
              </p>
            )}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 lg:px-6 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">4Save</span>
                <span className="text-muted-foreground/40 hidden sm:block">/</span>
                <h1 className="text-sm font-semibold text-foreground">{currentPage}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              )} />
              <span className="hidden sm:block">{isOnline ? 'online' : 'offline'}</span>
            </div>
          </header>

          {/* Área de conteúdo */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-4">
                <LocationTracker />
              </div>
              {children}
            </div>
            <div className="mt-8 pt-4 border-t border-border flex justify-center pb-4">
              <span className="text-xs text-muted-foreground font-mono">
                © 2024 4Save — Sistema de Gestão Técnica
              </span>
            </div>
          </main>
        </div>
      </div>
    </AdminTheme>
  );
}
