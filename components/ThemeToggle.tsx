'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  collapsed?: boolean;
  className?: string;
}

export function ThemeToggle({ collapsed, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Modo Claro' : 'Modo Escuro';

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        type="button"
        className={cn(
          'w-full text-muted-foreground border-border hover:bg-accent hover:text-foreground transition-colors',
          collapsed ? 'h-10 w-10 p-0 justify-center' : 'justify-start',
          className
        )}
        disabled
        suppressHydrationWarning
      >
        <span className={cn('h-4 w-4', !collapsed && 'mr-2')} aria-hidden />
        {!collapsed && 'Tema'}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'w-full text-muted-foreground border-border hover:bg-accent hover:text-foreground transition-colors',
        collapsed ? 'h-10 w-10 p-0 justify-center' : 'justify-start',
        className
      )}
      title={collapsed ? label : undefined}
    >
      {isDark ? (
        <Sun className={cn('h-4 w-4 text-amber-300', !collapsed && 'mr-2')} />
      ) : (
        <Moon className={cn('h-4 w-4 text-slate-200', !collapsed && 'mr-2')} />
      )}
      {!collapsed && label}
    </Button>
  );
}
