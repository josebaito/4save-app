'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AdminTheme } from './AdminTheme';
import {
  Home,
  Users,
  FileText,
  Ticket,
  Menu,
  X,
  LogOut,
  // Settings,
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
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleSignOut = async () => {
    // Force clean redirect
    await signOut({ callbackUrl: '/', redirect: true });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">4Save</h2>
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
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Scrollable Page Content */}
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