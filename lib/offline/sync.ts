// Funcionalidades de sincronização offline com IndexedDB
import { db } from '@/lib/db/supabase';
import type { RelatorioTecnico } from '@/types';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OfflineData {
  tickets: unknown[];
  relatorios: RelatorioTecnico[];
  lastSync: string;
}

interface MyDB extends DBSchema {
  'offline_data': {
    key: string;
    value: OfflineData;
  };
}

const DB_NAME = '4save-offline-db';
const STORE_NAME = 'offline_data';
const DATA_KEY = 'main_data';

export const offlineSync = {
  // Inicializar DB
  initDB: async (): Promise<IDBPDatabase<MyDB>> => {
    return openDB<MyDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  },

  // Salvar dados offline
  saveOfflineData: async (data: Partial<OfflineData>): Promise<boolean> => {
    try {
      const db = await offlineSync.initDB();
      const existingData = await offlineSync.getOfflineData();

      const newData = {
        ...existingData,
        ...data,
        lastSync: new Date().toISOString()
      };

      await db.put(STORE_NAME, newData, DATA_KEY);
      return true;
    } catch (error) {
      console.error('Error saving offline data:', error);
      return false;
    }
  },

  // Recuperar dados offline
  getOfflineData: async (): Promise<OfflineData> => {
    try {
      const db = await offlineSync.initDB();
      const data = await db.get(STORE_NAME, DATA_KEY);

      if (data) {
        return data;
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }

    // Default structure
    return {
      tickets: [],
      relatorios: [],
      lastSync: new Date().toISOString()
    };
  },

  // Verificar se está online
  isOnline: (): boolean => {
    // Check both navigator.onLine and potentially a ping to the API if needed
    // For now, simple navigator check is fast and synchronous
    return typeof navigator !== 'undefined' && navigator.onLine;
  },

  // Salvar relatório para sincronização posterior
  saveOfflineRelatorio: async (relatorio: RelatorioTecnico) => {
    const data = await offlineSync.getOfflineData();
    const existingIndex = data.relatorios.findIndex(r => r.id === relatorio.id || r.ticket_id === relatorio.ticket_id);

    if (existingIndex >= 0) {
      data.relatorios[existingIndex] = relatorio;
    } else {
      data.relatorios.push(relatorio);
    }

    return offlineSync.saveOfflineData({ relatorios: data.relatorios });
  },

  // Obter relatórios pendentes de sincronização
  getPendingSync: async () => {
    const data = await offlineSync.getOfflineData();
    return data.relatorios;
  },

  // Marcar item como sincronizado
  markAsSynced: async (id: string, type: 'ticket' | 'relatorio') => {
    const data = await offlineSync.getOfflineData();

    if (type === 'relatorio') {
      const index = data.relatorios.findIndex(r => r.id === id);
      if (index >= 0) {
        // Remover o relatório da lista de pendentes
        data.relatorios.splice(index, 1);
      }
    }

    return offlineSync.saveOfflineData(data);
  },

  // Limpar dados offline
  clearOfflineData: async () => {
    try {
      const db = await offlineSync.initDB();
      await db.clear(STORE_NAME);
      // Also clear legacy localStorage just in case
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('offline_data');
      }
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  },

  // Sincronização real com Backend
  syncPendingData: async () => {
    if (!offlineSync.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }

    const pendingData = await offlineSync.getPendingSync();
    if (pendingData.length === 0) {
      return { success: true, message: 'Nenhum dado pendente para sincronizar', synced: 0 };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    for (const relatorio of pendingData) {
      try {
        const cleanRelatorio = relatorio;

        if (relatorio.id) {
          await db.updateRelatorio(relatorio.id, cleanRelatorio);
        } else {
          await db.createRelatorio(cleanRelatorio);
        }

        await offlineSync.markAsSynced(relatorio.id || relatorio.ticket_id, 'relatorio');
        syncedCount++;

        console.log(`Relatório sincronizado: ${relatorio.ticket_id}`);
      } catch (error) {
        console.error('Erro ao sincronizar relatório:', error);
        errors.push(`Erro ao sincronizar relatório ${relatorio.ticket_id}: ${error}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Erros na sincronização: ${errors.join(', ')}`);
    }

    return {
      success: true,
      message: `${syncedCount} item(s) sincronizado(s) com sucesso!`,
      synced: syncedCount
    };
  },

  // Verificar conexão e sincronizar
  syncIfOnline: async (syncFunction?: () => Promise<void>) => {
    if (!offlineSync.isOnline()) {
      return { success: false, message: 'Sem conexão com a internet' };
    }

    try {
      if (syncFunction) {
        await syncFunction();
      } else {
        await offlineSync.syncPendingData();
      }
      return { success: true, message: 'Dados sincronizados com sucesso!' };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, message: `Erro na sincronização: ${error}` };
    }
  },

  // Verificar status de sincronização
  getSyncStatus: async () => {
    const data = await offlineSync.getOfflineData();
    const pendingCount = data.relatorios.length;
    const lastSync = data.lastSync;

    return {
      pendingCount,
      lastSync,
      isOnline: offlineSync.isOnline(),
      hasPendingData: pendingCount > 0
    };
  }
};