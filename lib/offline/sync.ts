// Funcionalidades de sincronização offline
import { db } from '@/lib/db/supabase';
import type { RelatorioTecnico } from '@/types';

export interface OfflineData {
  tickets: unknown[];
  relatorios: RelatorioTecnico[];
  lastSync: string;
}

const STORAGE_KEY = 'offline_data';

export const offlineSync = {
  // Salvar dados offline
  saveOfflineData: (data: Partial<OfflineData>) => {
    try {
      const existingData = offlineSync.getOfflineData();
      const newData = {
        ...existingData,
        ...data,
        lastSync: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return true;
    } catch (error) {
      console.error('Error saving offline data:', error);
      return false;
    }
  },

  // Recuperar dados offline
  getOfflineData: (): OfflineData => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
    
    return {
      tickets: [],
      relatorios: [],
      lastSync: new Date().toISOString()
    };
  },

  // Verificar se está online
  isOnline: (): boolean => {
    return navigator.onLine;
  },

  // Salvar relatório para sincronização posterior
  saveOfflineRelatorio: (relatorio: RelatorioTecnico) => {
    const data = offlineSync.getOfflineData();
    const existingIndex = data.relatorios.findIndex(r => r.id === relatorio.id || r.ticket_id === relatorio.ticket_id);
    
    if (existingIndex >= 0) {
      data.relatorios[existingIndex] = relatorio;
    } else {
      data.relatorios.push(relatorio);
    }
    
    return offlineSync.saveOfflineData({ relatorios: data.relatorios });
  },

  // Obter relatórios pendentes de sincronização
  getPendingSync: () => {
    const data = offlineSync.getOfflineData();
    return data.relatorios;
  },

  // Marcar item como sincronizado
  markAsSynced: (id: string, type: 'ticket' | 'relatorio') => {
    const data = offlineSync.getOfflineData();
    
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
  clearOfflineData: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  },

  // ✅ NOVA FUNÇÃO: Sincronização real com Supabase
  syncPendingData: async () => {
    if (!offlineSync.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }

    const pendingData = offlineSync.getPendingSync();
    if (pendingData.length === 0) {
      return { success: true, message: 'Nenhum dado pendente para sincronizar', synced: 0 };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    for (const relatorio of pendingData) {
      try {
        // Usar o relatório diretamente
        const cleanRelatorio = relatorio;
        
        if (relatorio.id) {
          // Atualizar relatório existente
          await db.updateRelatorio(relatorio.id, cleanRelatorio);
        } else {
          // Criar novo relatório
          await db.createRelatorio(cleanRelatorio);
        }
        
        // Marcar como sincronizado
        offlineSync.markAsSynced(relatorio.id || relatorio.ticket_id, 'relatorio');
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

  // ✅ NOVA FUNÇÃO: Verificar status de sincronização
  getSyncStatus: () => {
    const data = offlineSync.getOfflineData();
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