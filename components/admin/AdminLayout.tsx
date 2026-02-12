'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AdminTheme } from './AdminTheme';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  MapPin
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Técnicos', href: '/admin/tecnicos', icon: Users },
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/', redirect: true });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
              <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                4Save
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
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminTheme>
  );
}
