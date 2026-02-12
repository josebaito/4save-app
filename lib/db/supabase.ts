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

    async getRelatorioById(id: string, token?: string): Promise<RelatorioTecnico | null> {
        try {
            return await api.relatorios.get(id, token);
        } catch { return null; }
    },

    async getAllRelatorios(token?: string): Promise<RelatorioTecnico[]> {
        return api.relatorios.list(token);
    },

    async getDashboardStats(token?: string): Promise<DashboardStats> {
        return api.relatorios.getStats(token);
    },

    // Técnicos
    async getTecnicos(token?: string): Promise<User[]> {
        const users = await api.users.listTecnicos(token);

        // Correct online status based on last_seen timestamp (5 min threshold)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        return users.map((u: any) => {
            const lastSeen = u.last_seen ? new Date(u.last_seen) : new Date(0);
            // If marked online but hasn't been seen in 5 mins, mark as offline
            if (u.is_online && lastSeen < fiveMinutesAgo) {
                return { ...u, is_online: false };
            }
            return u;
        });
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

    async getTecnicosOnline(token?: string): Promise<User[]> {
        return api.users.getOnline(token);
    },

    async getTecnicosDisponiveis(token?: string): Promise<User[]> {
        const tecnicos = await api.users.listTecnicos(token);
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

    async criarCronogramaManutencao(contratoId: string, plano: PlanoManutencao, token?: string): Promise<void> {
        return api.manutencao.createCronograma(contratoId, plano, token);
    },

    async atualizarCronogramaManutencao(id: string, updates: any, token?: string): Promise<void> {
        return api.manutencao.updateCronograma(id, updates, token);
    },

    async deletarCronogramaManutencao(id: string, token?: string): Promise<void> {
        return api.manutencao.deleteCronograma(id, token);
    },
    async gerarTicketsManutencao(token?: string): Promise<void> {
        console.log('[INFO] Executing maintenance generation logic (BFF/Simulation)...');
        try {
            const cronogramas = await this.getCronogramasManutencao(token);
            if (!cronogramas || cronogramas.length === 0) {
                console.log('[INFO] No maintenance schedules found.');
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tickets = await this.getTickets(token);
            const contratos = await this.getContratos(token);
            const contratosById = new Map(contratos.map(c => [c.id, c]));

            const dueSchedules = cronogramas.filter(c => {
                if (!c.proxima_manutencao) return false;
                const nextDate = new Date(c.proxima_manutencao);
                nextDate.setHours(0, 0, 0, 0);
                return nextDate <= today && c.status === 'ativo';
            });

            console.log(`[INFO] Found ${dueSchedules.length} due schedules.`);

            for (const schedule of dueSchedules) {
                try {
                    const existingOpenTicket = tickets.find(t =>
                        t.contrato_id === schedule.contrato_id &&
                        t.tipo === 'manutencao' &&
                        t.status !== 'finalizado' &&
                        t.status !== 'cancelado'
                    );

                    if (existingOpenTicket) {
                        console.log(`[INFO] Ticket already exists for contract ${schedule.contrato_id}, skipping.`);
                        continue;
                    }

                    const contrato = schedule.contrato ?? contratosById.get(schedule.contrato_id);
                    const clienteId = contrato?.cliente_id;

                    if (!clienteId) {
                        console.error(`[ERROR] Missing cliente_id for contrato ${schedule.contrato_id}. Skipping.`);
                        continue;
                    }

                    const novoTicket = {
                        cliente_id: clienteId,
                        contrato_id: schedule.contrato_id,
                        titulo: `Manutencao ${schedule.tipo_manutencao} - ${contrato?.numero || 'Contrato'}`,
                        descricao: `Manutencao automatica gerada pelo cronograma. Tipo: ${schedule.tipo_manutencao}. Observacoes: ${schedule.observacoes || 'N/A'}`,
                        tipo: 'manutencao',
                        prioridade: schedule.tipo_manutencao === 'corretiva' ? 'alta' : 'media',
                        status: 'pendente'
                    };

                    const created = await this.createTicket(novoTicket, token);
                    if (created?.id) {
                        tickets.push(created);
                        await this.atribuirTecnicoInteligente(created.id, contrato?.tipo_produto, token);
                    }

                    console.log(`[OK] Ticket created for contract ${schedule.contrato_id}`);

                    const nextDate = new Date(schedule.proxima_manutencao);
                    switch (schedule.frequencia) {
                        case 'mensal': nextDate.setMonth(nextDate.getMonth() + 1); break;
                        case 'trimestral': nextDate.setMonth(nextDate.getMonth() + 3); break;
                        case 'semestral': nextDate.setMonth(nextDate.getMonth() + 6); break;
                        case 'anual': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                    }

                    await this.atualizarCronogramaManutencao(schedule.id, {
                        proxima_manutencao: nextDate.toISOString().split('T')[0]
                    }, token);

                } catch (err) {
                    console.error(`[ERROR] Failed to process schedule ${schedule.id}:`, err);
                }
            }
        } catch (error) {
            console.error('[ERROR] Error generating maintenance tickets:', error);
            throw error;
        }
    },

    async atribuirTecnicoInteligente(ticketId: string, tipoProduto?: string, token?: string): Promise<User | null> {
        const allTecnicos = await api.users.listTecnicos(token);
        const allTickets = await api.tickets.list(token);

        const ticketsPorTecnico: Record<string, number> = {};
        for (const t of allTecnicos) {
            ticketsPorTecnico[t.id] = 0;
        }
        for (const ticket of allTickets) {
            if (ticket.tecnico_id && ticket.status !== 'finalizado' && ticket.status !== 'cancelado') {
                const tid = String(ticket.tecnico_id);
                ticketsPorTecnico[tid] = (ticketsPorTecnico[tid] ?? 0) + 1;
            }
        }

        const candidates = allTecnicos.filter((t: any) =>
            t.status === 'ativo' && t.disponibilidade === true
        );
        if (candidates.length === 0) return null;

        const scoredCandidates = candidates.map((t: any) => {
            const numTickets = ticketsPorTecnico[t.id] ?? 0;
            let tieBreak = 0;
            if (tipoProduto && t.especialidade) {
                const prod = tipoProduto.toLowerCase();
                const spec = (t.especialidade || '').toLowerCase();
                if (spec.includes(prod) ||
                    (prod.includes('solar') && spec.includes('eletrica')) ||
                    (prod.includes('agua') && spec.includes('hidraulica'))) {
                    tieBreak += 50;
                }
            }
            const rating = parseFloat(t.avaliacao) || 0;
            tieBreak += rating * 5;
            if (t.is_online === true) tieBreak += 10;
            return { tecnico: t, numTickets, tieBreak };
        });

        scoredCandidates.sort((a: any, b: any) => {
            if (a.numTickets !== b.numTickets) return a.numTickets - b.numTickets;
            return b.tieBreak - a.tieBreak;
        });
        const selected = scoredCandidates[0].tecnico;

        if (selected) {
            await api.tickets.update(ticketId, {
                tecnico_id: selected.id
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

    async liberarTecnico(userId: string, token?: string): Promise<void> {
        try {
            await api.users.update(userId, {
                disponibilidade: true,
                status: 'ativo'
            }, token);
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

    async verificarQualidadeRelatorio(relatorioId: string, token?: string): Promise<{
        checklist_completo: boolean;
        fotos_minimas_atingidas: boolean;
        tempo_dentro_limite: boolean;
        observacoes_qualidade: string[];
    }> {
        const relatorio = await api.relatorios.get(relatorioId, token);
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

    async aprovarRelatorio(relatorioId: string, token?: string): Promise<void> {
        return api.relatorios.update(relatorioId, { aprovado_admin: true }, token);
    },

    async rejeitarRelatorio(relatorioId: string, adminId: string, motivo: string, token?: string): Promise<void> {
        return api.relatorios.update(relatorioId, {
            aprovado_admin: false,
            feedback_admin: motivo
        }, token);
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
