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

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <AdminTheme>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <div className="flex flex-1">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-75 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 bg-slate-800 shadow-2xl transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              sidebarCollapsed ? 'w-16' : 'w-64 sm:w-72'
            )}
          >
            <div className="flex flex-col h-full">
              {/* Logo - Fixed Header */}
              <div className={cn(
                "flex items-center h-16 border-b border-slate-700",
                sidebarCollapsed ? "justify-center px-2" : "justify-between px-6"
              )}>
                {!sidebarCollapsed && (
                  <h2 className="text-xl font-bold text-white">4Save Admin</h2>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex text-slate-400 hover:text-white"
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

              {/* Navigation - Scrollable */}
              <nav className={cn(
                "flex-1 py-6 space-y-2 overflow-y-auto",
                sidebarCollapsed ? "px-2" : "px-4"
              )}>
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
                          : 'text-slate-300 hover:text-white hover:bg-slate-700',
                        sidebarCollapsed ? 'justify-center' : ''
                      )}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5',
                          isActive ? 'text-white' : 'text-slate-400',
                          sidebarCollapsed ? '' : 'mr-3'
                        )}
                      />
                      {!sidebarCollapsed && item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 px-4 py-4 lg:px-8">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-slate-400 hover:text-white"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-semibold text-white">
                    {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                  </h1>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session?.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block">
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
                    className="text-slate-300 hover:text-red-400 hover:bg-slate-700"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Page content */}
            <main className="flex-1 p-4 lg:p-8 bg-slate-900">
              {children}
            </main>
          </div>
        </div>
        
        {/* Simple Footer */}
        <footer className="bg-slate-800 border-t border-slate-700 px-4 py-3">
          <div className="flex items-center justify-center">
            <span className="text-xs text-slate-400">
              © 2024 4Save - Sistema de Gestão
            </span>
          </div>
        </footer>
      </div>
    </AdminTheme>
  );
}