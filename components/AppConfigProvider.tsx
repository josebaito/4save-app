'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AppConfig } from '@/lib/app-config';

type AppConfigState = {
  config: AppConfig;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT_CONFIG: AppConfig = {
  appName: '4Save',
  reportLogoUrl: '',
  pdfTemplate: 'classic',
  updatedAt: new Date(0).toISOString(),
};

const AppConfigContext = createContext<AppConfigState | null>(null);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/public-config', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as AppConfig;
      setConfig({
        ...DEFAULT_CONFIG,
        ...data,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!config?.appName) return;
    document.title = `${config.appName} - Sistema de Gestão Técnica`;
  }, [config?.appName]);

  const value = useMemo<AppConfigState>(() => ({ config, loading, refresh }), [config, loading]);

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    return { config: DEFAULT_CONFIG, loading: true, refresh: async () => {} };
  }
  return ctx;
}

