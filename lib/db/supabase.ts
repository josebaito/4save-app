import { api } from './api';
import {
    Cliente,
    Contrato,
    Ticket,
    RelatorioTecnico,
    User,
    DashboardStats,
    CronogramaManutencao,
    PlanoManutencao,
    HistoricoManutencao
} from '@/types';

// Backward compatibility layer replacing Supabase with API calls
export const db = {
    // Clientes
    async getClientes(token?: string): Promise<Cliente[]> {
        return api.clientes.list(token);
    },

    async getClienteById(id: string, token?: string): Promise<Cliente | null> {
        try {
            return await api.clientes.get(id, token);
        } catch { return null; }
    },

    async createCliente(cliente: any, token?: string): Promise<Cliente> {
        return api.clientes.create(cliente, token);
    },

    async updateCliente(id: string, updates: any, token?: string): Promise<Cliente> {
        return api.clientes.update(id, updates, token);
    },

    // Contratos
    async getContratos(token?: string): Promise<Contrato[]> {
        return api.contratos.list(token);
    },

    async getContratoById(id: string, token?: string): Promise<Contrato | null> {
        try {
            return await api.contratos.get(id, token);
        } catch { return null; }
    },

    async createContrato(contrato: any, token?: string): Promise<Contrato> {
        return api.contratos.create(contrato, token);
    },

    async updateContrato(id: string, updates: any, token?: string): Promise<Contrato> {
        return api.contratos.update(id, updates, token);
    },

    // Tickets
    async getTickets(token?: string): Promise<Ticket[]> {
        return api.tickets.list(token);
    },

    async getTicketsByTecnico(tecnicoId: string, token?: string): Promise<Ticket[]> {
        return api.tickets.listByTecnico(tecnicoId, token);
    },

    async createTicket(ticket: any, token?: string): Promise<Ticket> {
        return api.tickets.create(ticket, token);
    },

    async updateTicket(id: string, updates: any, token?: string): Promise<Ticket> {
        return api.tickets.update(id, updates, token);
    },

    // Relatórios
    async createRelatorio(relatorio: any, token?: string): Promise<RelatorioTecnico> {
        return api.relatorios.create(relatorio, token);
    },

    async updateRelatorio(id: string, updates: any, token?: string): Promise<RelatorioTecnico> {
        return api.relatorios.update(id, updates, token);
    },

    async getRelatorioById(id: string): Promise<RelatorioTecnico | null> {
        try {
            return await api.relatorios.get(id);
        } catch { return null; }
    },

    async getAllRelatorios(): Promise<RelatorioTecnico[]> {
        return api.relatorios.list();
    },

    async getDashboardStats(): Promise<DashboardStats> {
        return api.relatorios.getStats();
    },

    // Técnicos
    async getTecnicos(token?: string): Promise<User[]> {
        return api.users.listTecnicos(token);
    },

    async getTecnicoById(id: string, token?: string): Promise<User | null> {
        try {
            return await api.users.get(id, token);
        } catch { return null; }
    },

    async updateTecnico(id: string, updates: any, token?: string): Promise<User> {
        return api.users.update(id, updates, token);
    },

    async createTecnico(tecnico: any, token?: string): Promise<User> {
        return api.users.create(tecnico, token);
    },

    async deleteTecnico(id: string, token?: string): Promise<void> {
        return api.users.delete(id, token);
    },

    async getTecnicoLocationsWithUsers(token?: string): Promise<any[]> {
        // Fetch technicians and map to location format if GPS data exists
        const tecnicos = await api.users.listTecnicos(token);
        // Mock data for map if gps is null, or use real data
        return tecnicos.map((t: any) => ({
            tecnico_id: t.id,
            latitude: t.localizacao_gps ? parseFloat(t.localizacao_gps.split(',')[0]) : -23.5505,
            longitude: t.localizacao_gps ? parseFloat(t.localizacao_gps.split(',')[1]) : -46.6333,
            timestamp: t.last_seen || new Date().toISOString(),
            updated_at: t.updated_at,
            name: t.name,
            email: t.email,
            especialidade: t.especialidade,
            is_online: t.is_online,
            last_seen: t.last_seen,
            disponibilidade: t.disponibilidade
        }));
    },

    async getTecnicosOnline(): Promise<User[]> {
        return api.users.getOnline();
    },

    async getTecnicosDisponiveis(): Promise<User[]> {
        const tecnicos = await api.users.listTecnicos();
        return tecnicos.filter((t: any) => t.disponibilidade);
    },

    // Manutenção & Sistema
    async verificarSistemaCompleto() {
        return api.manutencao.verifySystem();
    },

    async getCronogramasManutencao(token?: string): Promise<CronogramaManutencao[]> {
        return api.manutencao.listCronogramas(token);
    },

    async getHistoricoManutencao(token?: string): Promise<HistoricoManutencao[]> {
        return api.manutencao.listHistorico(token);
    },

    async criarCronogramaManutencao(contratoId: string, plano: PlanoManutencao): Promise<void> {
        return api.manutencao.createCronograma(contratoId, plano);
    },

    async atualizarCronogramaManutencao(id: string, updates: any): Promise<void> {
        return api.manutencao.updateCronograma(id, updates);
    },

    async deletarCronogramaManutencao(id: string): Promise<void> {
        return api.manutencao.deleteCronograma(id);
    },

    async atribuirTecnicoInteligente(ticketId: string, tipoProduto?: string, token?: string): Promise<User | null> {
        // Fetch fresh list of technicians
        const allTecnicos = await api.users.listTecnicos(token);

        // 1. Filter: Valid Status & Availability
        let candidates = allTecnicos.filter((t: any) =>
            t.status === 'ativo' &&
            t.disponibilidade === true &&
            t.is_online === true // Prefer online technicians for immediate response
        );

        // Fallback: If no online techs, check all available active ones
        if (candidates.length === 0) {
            candidates = allTecnicos.filter((t: any) => t.status === 'ativo' && t.disponibilidade === true);
        }

        if (candidates.length === 0) return null;

        // 2. Score Candidates
        const scoredCandidates = candidates.map((t: any) => {
            let score = 0;

            // Specialty Match
            if (tipoProduto && t.especialidade) {
                const prod = tipoProduto.toLowerCase();
                const spec = t.especialidade.toLowerCase();
                if (spec.includes(prod) ||
                    (prod.includes('solar') && spec.includes('elétrica')) ||
                    (prod.includes('agua') && spec.includes('hidráulica'))) {
                    score += 100;
                }
            }

            // Rating Weight (0-50 pts)
            const rating = parseFloat(t.avaliacao) || 0;
            score += rating * 10;

            // Workload balancing (Mock: random penalty 0-20 to distribute work)
            score -= Math.random() * 20;

            return { tecnico: t, score };
        });

        // 3. Sort by Score Descending
        scoredCandidates.sort((a: any, b: any) => b.score - a.score);

        const selected = scoredCandidates[0].tecnico;

        // 4. Assign
        if (selected) {
            await api.tickets.update(ticketId, {
                tecnico_id: selected.id,
                status: 'em_curso'
            }, token);
            return selected;
        }

        return null;
    },

    async updateTecnicoOnlineStatus(userId: string, isOnline: boolean, token?: string): Promise<void> {
        try {
            await api.users.update(userId, {
                is_online: isOnline,
                last_seen: new Date().toISOString()
            }, token);
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    },

    async sincronizarDisponibilidadeTecnicos(): Promise<void> {
        // Mock sync for now
        console.log('🔄 Sincronizando disponibilidade (Mock)...');
    },

    async updateTecnicoLocation(userId: string, latitude: number, longitude: number, token?: string): Promise<void> {
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            console.warn('Skipping location update: Invalid coordinates', { latitude, longitude });
            return;
        }
        try {
            await api.users.update(userId, {
                localizacao_gps: `${latitude},${longitude}`,
                last_seen: new Date().toISOString()
            }, token);
        } catch (error) {
            console.error('Error updating location:', error);
        }
    },

    async liberarTecnico(userId: string): Promise<void> {
        try {
            await api.users.update(userId, {
                disponibilidade: true,
                status: 'ativo'
            });
        } catch (error) {
            console.error('Error liberating technician:', error);
        }
    },

    async getRelatorioByTicket(ticketId: string, token?: string): Promise<RelatorioTecnico | null> {
        try {
            // New endpoint we will create in backend
            return await api.relatorios.getByTicket(ticketId, token);
        } catch (error) {
            console.error('Error fetching relatorio by ticket:', error);
            return null;
        }
    },

    async verificarQualidadeRelatorio(relatorioId: string): Promise<{
        checklist_completo: boolean;
        fotos_minimas_atingidas: boolean;
        tempo_dentro_limite: boolean;
        observacoes_qualidade: string[];
    }> {
        const relatorio = await api.relatorios.get(relatorioId);
        if (!relatorio) throw new Error("Relatório não encontrado");

        const fotos_minimas_atingidas = (relatorio.fotos_antes?.length || 0) >= 2 && (relatorio.fotos_depois?.length || 0) >= 2;
        const checklist_completo = !!relatorio.diagnostico && !!relatorio.acoes_realizadas && !!relatorio.assinatura_cliente;
        const tempo_dentro_limite = (relatorio.tempo_execucao || 0) < 7200; // Mock: 2 hours

        const observacoes_qualidade = [];
        if (!fotos_minimas_atingidas) observacoes_qualidade.push("Número de fotos insuficiente");
        if (!checklist_completo) observacoes_qualidade.push("Checklist incompleto (diagnóstico, ações ou assinatura ausentes)");
        if (!tempo_dentro_limite) observacoes_qualidade.push("Tempo de execução acima do esperado");

        return {
            checklist_completo,
            fotos_minimas_atingidas,
            tempo_dentro_limite,
            observacoes_qualidade
        };
    },

    async aprovarRelatorio(relatorioId: string): Promise<void> {
        return api.relatorios.update(relatorioId, { aprovado_admin: true });
    },

    async rejeitarRelatorio(relatorioId: string, adminId: string, motivo: string): Promise<void> {
        return api.relatorios.update(relatorioId, {
            aprovado_admin: false,
            feedback_admin: motivo
        });
    }
};

export const createSupabaseClient = () => {
    console.warn('createSupabaseClient deprecated. Using API proxy.');
    return {
        from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: {}, error: null }) }) }) }),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        }
    };
};
