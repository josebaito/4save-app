'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AdminTheme } from './AdminTheme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppConfig } from '@/components/AppConfigProvider';
import {
  Home,
  Users,
  User,
  FileText,
  Ticket,
  Menu,
  X,
  LogOut,
  Settings,
  FileBarChart,
  Calendar,
  MapPin,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Técnicos', href: '/admin/tecnicos', icon: User },
  { name: 'Localização', href: '/admin/tecnicos/mapa', icon: MapPin },
  { name: 'Contratos', href: '/admin/contratos', icon: FileText },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Manutenção', href: '/admin/manutencao', icon: Calendar },
  { name: 'Relatórios', href: '/admin/relatorios', icon: FileBarChart },
  { name: 'Perfil', href: '/admin/perfil', icon: User },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { config } = useAppConfig();
  const appName = config.appName || '4Save';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/', redirect: true });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
          {/* Logo e colapso */}
          <div
            className={cn(
              'flex h-16 items-center border-b border-sidebar-border shrink-0',
              sidebarCollapsed ? 'justify-center px-0' : 'px-5 justify-between'
            )}
          >
            {!sidebarCollapsed && (
              <Link href="/admin" className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-heading font-bold text-sidebar-foreground leading-none">{appName}</span>
                  <span className="text-[10px] font-mono text-sidebar-foreground/40 leading-none mt-0.5 uppercase tracking-wider">Administrador</span>
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
            {/* Info do utilizador */}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/60">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary to-orange-300 flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate leading-none">{session?.user?.name}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate leading-none mt-0.5">{session?.user?.email}</p>
                </div>
              </div>
            )}

            <div
              className={cn(
                sidebarCollapsed
                  ? 'flex flex-col items-center gap-1'
                  : 'grid grid-cols-2 gap-2'
              )}
            >
              <ThemeToggle collapsed={sidebarCollapsed} className={cn(!sidebarCollapsed && 'w-full')} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={cn(
                  'text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg',
                  sidebarCollapsed ? 'h-9 w-9 p-0' : 'w-full justify-start gap-2 min-w-0'
                )}
                title={sidebarCollapsed ? 'Sair' : undefined}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm truncate">Sair</span>}
              </Button>
            </div>
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
                <span className="text-xs text-muted-foreground hidden sm:block">{appName}</span>
                <span className="text-muted-foreground/40 hidden sm:block">/</span>
                <h1 className="text-sm font-semibold text-foreground">{currentPage}</h1>
              </div>
            </div>

            {/* Info do utilizador no header (desktop) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>online</span>
            </div>
          </header>

          {/* Área de conteúdo */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminTheme>
  );
}
