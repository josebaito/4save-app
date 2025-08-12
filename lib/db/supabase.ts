import { createClient } from '@supabase/supabase-js';
import type { 
  Cliente, 
  Contrato, 
  Ticket, 
  RelatorioTecnico, 
  User, 
  DashboardStats, 
  CronogramaManutencao, 
  HistoricoManutencao,
  PlanoManutencao
} from '@/types';

export const createSupabaseClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Função para validar UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export const db = {
  // Clientes
  async getClientes(): Promise<Cliente[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  },

  async getClienteById(id: string): Promise<Cliente | null> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('clientes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Contratos
  async getContratos(): Promise<Contrato[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('contratos')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getContratoById(id: string): Promise<Contrato | null> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('contratos')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async createContrato(contrato: Omit<Contrato, 'id' | 'created_at' | 'updated_at'>): Promise<Contrato> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('contratos')
      .insert(contrato)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateContrato(id: string, updates: Partial<Contrato>): Promise<Contrato> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('contratos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        cliente:clientes(*),
        contrato:contratos(*),
        tecnico:users(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getTicketsByTecnico(tecnicoId: string): Promise<Ticket[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        cliente:clientes(*),
        contrato:contratos(*),
        tecnico:users(*)
      `)
      .eq('tecnico_id', tecnicoId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
    try {
      const supabase = createSupabaseClient();
      const ticketData = { ...ticket };
      
      // Se tecnico_id estiver vazio, remover do objeto
      if (ticketData.tecnico_id === '') {
        delete ticketData.tecnico_id;
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro Supabase ao criar ticket:', error);
        throw new Error(`Erro ao criar ticket: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Exceção ao criar ticket:', error);
      throw error;
    }
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Usuários
  async getTecnicos(): Promise<User[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'tecnico')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getTecnicosDisponiveis(): Promise<User[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'tecnico')
      .eq('status', 'ativo')
      .eq('disponibilidade', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getTecnicosOnline(): Promise<User[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'tecnico')
      .eq('status', 'ativo')
      .eq('is_online', true)
      .eq('disponibilidade', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async checkAndUpdateOnlineStatus(): Promise<void> {
    const supabase = createSupabaseClient();
    const timeoutThreshold = 2 * 60 * 1000; // 2 minutos
    const now = new Date();
    
    // Buscar técnicos que não atualizaram status há mais de 2 minutos
    const { data: tecnicos, error } = await supabase
      .from('users')
      .select('id, last_seen, is_online')
      .eq('type', 'tecnico')
      .eq('is_online', true);
    
    if (error) throw error;
    
    // Marcar como offline se ultrapassou o timeout
    for (const tecnico of tecnicos || []) {
      if (tecnico.last_seen) {
        const lastSeen = new Date(tecnico.last_seen);
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
        
        if (diffMinutes > 2) {
          await this.updateTecnico(tecnico.id, { 
            is_online: false,
            disponibilidade: false // Também marcar como indisponível
          });
        }
      }
    }
  },

  async updateTecnicoOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('users')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async getTecnicoById(id: string): Promise<User | null> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateTecnico(id: string, updates: Partial<User>): Promise<User> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTecnicoLocalizacao(id: string, localizacao: string): Promise<void> {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('users')
      .update({ 
        localizacao_gps: localizacao,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Atribuição Inteligente
  async atribuirTecnicoInteligente(ticketId: string, tipoProduto?: string): Promise<User | null> {
    try {
      // Buscar técnicos disponíveis
      const tecnicosDisponiveis = await this.getTecnicosDisponiveis();
      
      if (tecnicosDisponiveis.length === 0) {
        console.log('Nenhum técnico disponível encontrado');
        return null;
      }

      // Se temos tipo de produto, priorizar técnicos com especialidade compatível
      let tecnicosPriorizados = tecnicosDisponiveis;
      
      if (tipoProduto) {
        const tecnicosEspecializados = tecnicosDisponiveis.filter(t => 
          t.especialidade && t.especialidade.toLowerCase().includes(tipoProduto.toLowerCase())
        );
        
        if (tecnicosEspecializados.length > 0) {
          tecnicosPriorizados = tecnicosEspecializados;
        }
      }

      // Ordenar por avaliação (melhor primeiro) e depois por disponibilidade
      tecnicosPriorizados.sort((a, b) => {
        const avaliacaoA = a.avaliacao || 0;
        const avaliacaoB = b.avaliacao || 0;
        
        if (avaliacaoA !== avaliacaoB) {
          return avaliacaoB - avaliacaoA; // Melhor avaliação primeiro
        }
        
        // Se avaliação igual, priorizar quem está disponível há mais tempo
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      });

      const tecnicoEscolhido = tecnicosPriorizados[0];
      
      if (tecnicoEscolhido) {
        // Atualizar o ticket com o técnico escolhido
        await this.updateTicket(ticketId, { tecnico_id: tecnicoEscolhido.id });
        
        // Marcar técnico como indisponível temporariamente
        await this.updateTecnico(tecnicoEscolhido.id, { disponibilidade: false });
        
        console.log(`Técnico ${tecnicoEscolhido.name} atribuído ao ticket ${ticketId}`);
        return tecnicoEscolhido;
      }

      return null;
    } catch (error) {
      console.error('Erro na atribuição inteligente:', error);
      throw error;
    }
  },

  async liberarTecnico(tecnicoId: string): Promise<void> {
    await this.updateTecnico(tecnicoId, { disponibilidade: true });
  },

  // Controle de Qualidade
  async verificarQualidadeRelatorio(relatorioId: string): Promise<{
    checklist_completo: boolean;
    fotos_minimas_atingidas: boolean;
    tempo_dentro_limite: boolean;
    observacoes_qualidade: string[];
  }> {
    const relatorio = await this.getRelatorioById(relatorioId);
    if (!relatorio) throw new Error('Relatório não encontrado');

    const observacoes: string[] = [];
    let checklist_completo = true;
    let fotos_minimas_atingidas = true;
    let tempo_dentro_limite = true;

    // Verificar checklist obrigatório
    if (!relatorio.observacoes_iniciais || !relatorio.diagnostico || !relatorio.acoes_realizadas) {
      checklist_completo = false;
      observacoes.push('Informações obrigatórias incompletas');
    }

    // Verificar fotos mínimas (pelo menos 2 antes e 2 depois)
    const fotosAntes = relatorio.fotos_antes?.length || 0;
    const fotosDepois = relatorio.fotos_depois?.length || 0;
    
    if (fotosAntes < 2) {
      fotos_minimas_atingidas = false;
      observacoes.push(`Fotos antes insuficientes (${fotosAntes}/2 mínimo)`);
    }
    
    if (fotosDepois < 2) {
      fotos_minimas_atingidas = false;
      observacoes.push(`Fotos depois insuficientes (${fotosDepois}/2 mínimo)`);
    }

    // Verificar tempo de execução (máximo 4 horas)
    const tempoExecucao = relatorio.tempo_execucao || 0;
    const tempoMaximo = 4 * 60 * 60; // 4 horas em segundos
    
    if (tempoExecucao > tempoMaximo) {
      tempo_dentro_limite = false;
      const horas = Math.floor(tempoExecucao / 3600);
      const minutos = Math.floor((tempoExecucao % 3600) / 60);
      observacoes.push(`Tempo de execução excedido (${horas}h ${minutos}min > 4h)`);
    }

    // Verificar GPS
    if (!relatorio.localizacao_gps) {
      checklist_completo = false;
      observacoes.push('Localização GPS não capturada');
    }

    // Verificar assinaturas
    if (!relatorio.assinatura_tecnico || !relatorio.assinatura_cliente) {
      checklist_completo = false;
      observacoes.push('Assinaturas obrigatórias não encontradas');
    }

    return {
      checklist_completo,
      fotos_minimas_atingidas,
      tempo_dentro_limite,
      observacoes_qualidade: observacoes
    };
  },

  async aprovarRelatorio(relatorioId: string, adminId: string): Promise<void> {
    await this.updateRelatorio(relatorioId, { 
      aprovado_admin: true,
      observacoes_qualidade: 'Aprovado pelo administrador'
    });
  },

  async rejeitarRelatorio(relatorioId: string, adminId: string, motivo: string): Promise<void> {
    await this.updateRelatorio(relatorioId, { 
      aprovado_admin: false,
      observacoes_qualidade: `Rejeitado: ${motivo}`
    });
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = createSupabaseClient();
    const [clientes, ticketsPendentes, tecnicos, ticketsFinalizados] = await Promise.all([
      supabase.from('clientes').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('type', 'tecnico'),
      supabase.from('tickets').select('id', { count: 'exact', head: true })
        .eq('status', 'finalizado')
        .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    return {
      total_clientes: clientes.count || 0,
      total_contratos: 0,
      total_tickets: 0,
      tickets_pendentes: ticketsPendentes.count || 0,
      tickets_em_curso: 0,
      tickets_finalizados: 0,
      tickets_finalizados_mes: ticketsFinalizados.count || 0,
      contratos_ativos: 0,
      contratos_inativos: 0,
      contratos_vencidos: 0,
      tecnicos_ativos: tecnicos.count || 0,
    };
  },

  // Relatórios Técnicos
  async createRelatorio(relatorio: Omit<RelatorioTecnico, 'id' | 'created_at' | 'updated_at'>): Promise<RelatorioTecnico> {
    console.log('Criando relatório com dados:', relatorio);
    console.log('Localização GPS sendo salva:', relatorio.localizacao_gps);
    
    // Validar UUID do ticket
    if (!relatorio.ticket_id || typeof relatorio.ticket_id !== 'string') {
      throw new Error('ticket_id é obrigatório e deve ser uma string');
    }

    if (!isValidUUID(relatorio.ticket_id)) {
      throw new Error(`ticket_id inválido: ${relatorio.ticket_id}`);
    }

    // Validar ID do técnico
    if (!relatorio.tecnico_id || typeof relatorio.tecnico_id !== 'string') {
      throw new Error('tecnico_id é obrigatório e deve ser uma string');
    }

    // Para técnicos, aceitamos tanto UUIDs quanto IDs simples
    if (relatorio.tecnico_id.length > 0 && !isValidUUID(relatorio.tecnico_id) && !/^\d+$/.test(relatorio.tecnico_id)) {
      throw new Error(`tecnico_id inválido: ${relatorio.tecnico_id}`);
    }

    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('relatorios_tecnicos')
        .insert(relatorio)
        .select()
        .single();
      
      if (error) {
        console.error('Erro Supabase ao criar relatório:', error);
        throw new Error(`Erro ao criar relatório: ${error.message}`);
      }
      
      console.log('Relatório criado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Exceção ao criar relatório:', error);
      throw error;
    }
  },

  async updateRelatorio(id: string, updates: Partial<RelatorioTecnico>): Promise<RelatorioTecnico> {
    console.log('Atualizando relatório com dados:', updates);
    console.log('Localização GPS sendo atualizada:', updates.localizacao_gps);
    
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('relatorios_tecnicos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar relatório:', error);
      throw error;
    }
    
    console.log('Relatório atualizado com sucesso:', data);
    return data;
  },

  async getRelatorioByTicket(ticketId: string): Promise<RelatorioTecnico | null> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('relatorios_tecnicos')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      console.log('Relatório carregado do banco:', data);
      console.log('Localização GPS carregada:', data.localizacao_gps);
    }
    
    return data || null;
  },

  async getRelatorioById(relatorioId: string): Promise<RelatorioTecnico | null> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('relatorios_tecnicos')
      .select('*')
      .eq('id', relatorioId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      console.log('Relatório carregado por ID:', data);
      console.log('Localização GPS carregada:', data.localizacao_gps);
    }
    
    return data || null;
  },

  async getAllRelatorios(): Promise<RelatorioTecnico[]> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('relatorios_tecnicos')
      .select(`
        *,
        ticket:tickets(
          id,
          titulo,
          descricao,
          status,
          prioridade,
          tipo,
          created_at,
          cliente:clientes(id, nome, email, telefone),
          tecnico:users(id, name, email)
        ),
        tecnico:users(id, name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar relatórios:', error);
      throw error;
    }
    
    return data || [];
  },

  // ✅ NOVAS FUNÇÕES PARA SISTEMA DE MANUTENÇÃO

  // Criar cronograma de manutenção
  async criarCronogramaManutencao(contratoId: string, plano: PlanoManutencao): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      const cronograma = {
        contrato_id: contratoId,
        tipo_manutencao: plano.tipo,
        frequencia: plano.frequencia,
        proxima_manutencao: plano.inicio_manutencao,
        status: 'ativo'
      };
      
      const { error } = await supabase
        .from('cronograma_manutencao')
        .insert(cronograma);
      
      if (error) {
        console.error('Erro ao criar cronograma:', error);
        throw new Error(`Erro ao criar cronograma: ${error.message}`);
      }
    } catch (error) {
      console.error('Exceção ao criar cronograma:', error);
      throw error;
    }
  },

  // Obter cronogramas de manutenção
  async getCronogramasManutencao(): Promise<CronogramaManutencao[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('cronograma_manutencao')
        .select(`
          *,
          contrato:contratos(*)
        `)
        .order('proxima_manutencao', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar cronogramas:', error);
        throw new Error(`Erro ao buscar cronogramas: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Exceção ao buscar cronogramas:', error);
      throw error;
    }
  },

  // Gerar tickets de manutenção automáticos
  async gerarTicketsManutencao(): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      const hoje = new Date();
      const hojeStr = hoje.toISOString().split('T')[0];
      
      console.log('🔄 Iniciando geração de tickets de manutenção...');
      
      // Buscar todos os cronogramas ativos de uma vez
      const { data: todosCronogramas, error: errorCronogramas } = await supabase
        .from('cronograma_manutencao')
        .select(`
          *,
          contrato:contratos(*)
        `)
        .eq('status', 'ativo');
      
      if (errorCronogramas) {
        console.error('Erro ao buscar cronogramas:', errorCronogramas);
        throw new Error(`Erro ao buscar cronogramas: ${errorCronogramas.message}`);
      }
      
      if (!todosCronogramas || todosCronogramas.length === 0) {
        console.log('ℹ️ Nenhum cronograma ativo encontrado');
        return;
      }
      
      console.log(`📋 Encontrados ${todosCronogramas.length} cronogramas ativos`);
      
      // Separar cronogramas vencidos e próximos
      const cronogramasVencidos = todosCronogramas.filter(c => c.proxima_manutencao <= hojeStr);
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() + 7);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];
      
      const cronogramasProximos = todosCronogramas.filter(c => 
        c.proxima_manutencao > hojeStr && c.proxima_manutencao <= dataLimiteStr
      );
      
      console.log(`📅 Cronogramas vencidos: ${cronogramasVencidos.length}`);
      console.log(`🔔 Cronogramas próximos: ${cronogramasProximos.length}`);
      
      // Processar cronogramas vencidos em lote
      if (cronogramasVencidos.length > 0) {
        const ticketsParaCriar = [];
        const atualizacoesCronograma = [];
        
        for (const cronograma of cronogramasVencidos) {
          // Preparar ticket
          ticketsParaCriar.push({
            cliente_id: cronograma.contrato.cliente_id,
            contrato_id: cronograma.contrato_id,
            titulo: `Manutenção ${cronograma.tipo_manutencao} - ${cronograma.contrato.numero}`,
            descricao: `Manutenção ${cronograma.tipo_manutencao} agendada para ${cronograma.proxima_manutencao}. Contrato: ${cronograma.contrato.numero}`,
            tipo: 'manutencao',
            prioridade: cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media',
            status: 'pendente'
          });
          
          // Calcular próxima data
          const proximaData = this.calcularProximaData(hoje, cronograma.frequencia);
          atualizacoesCronograma.push({
            id: cronograma.id,
            proxima_manutencao: proximaData,
            ultima_manutencao: hojeStr
          });
        }
        
        // Criar tickets em lote
        if (ticketsParaCriar.length > 0) {
          const { error: errorTickets } = await supabase
            .from('tickets')
            .insert(ticketsParaCriar);
          
          if (errorTickets) {
            console.error('Erro ao criar tickets em lote:', errorTickets);
            throw new Error(`Erro ao criar tickets: ${errorTickets.message}`);
          }
          
          console.log(`✅ Criados ${ticketsParaCriar.length} tickets de manutenção`);
        }
        
        // Atualizar cronogramas em lote
        for (const atualizacao of atualizacoesCronograma) {
          const { error } = await supabase
            .from('cronograma_manutencao')
            .update({
              proxima_manutencao: atualizacao.proxima_manutencao,
              ultima_manutencao: atualizacao.ultima_manutencao
            })
            .eq('id', atualizacao.id);
          
          if (error) {
            console.error(`Erro ao atualizar cronograma ${atualizacao.id}:`, error);
          }
        }
        
        console.log(`✅ Atualizados ${atualizacoesCronograma.length} cronogramas`);
      }
      
      // Processar notificações para cronogramas próximos
      if (cronogramasProximos.length > 0) {
        await this.criarNotificacoesEmLote(cronogramasProximos);
        console.log(`🔔 Criadas notificações para ${cronogramasProximos.length} cronogramas próximos`);
      }
      
      console.log('✅ Geração de tickets concluída com sucesso');
    } catch (error) {
      console.error('❌ Exceção ao gerar tickets de manutenção:', error);
      throw error;
    }
  },

  // Função auxiliar para calcular próxima data
  calcularProximaData(dataAtual: Date, frequencia: string): string {
    const proximaData = new Date(dataAtual);
    
    switch (frequencia) {
      case 'mensal':
        proximaData.setMonth(proximaData.getMonth() + 1);
        break;
      case 'trimestral':
        proximaData.setMonth(proximaData.getMonth() + 3);
        break;
      case 'semestral':
        proximaData.setMonth(proximaData.getMonth() + 6);
        break;
      case 'anual':
        proximaData.setFullYear(proximaData.getFullYear() + 1);
        break;
      default:
        proximaData.setMonth(proximaData.getMonth() + 1);
    }
    
    return proximaData.toISOString().split('T')[0];
  },

  // Função auxiliar para criar notificações em lote
  async criarNotificacoesEmLote(cronogramas: any[]): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      // Verificar se a tabela de notificações existe uma única vez
      const { error: tableError } = await supabase
        .from('notificacoes')
        .select('id')
        .limit(1);
      
      const tabelaNotificacoesExiste = !tableError || tableError.code !== 'PGRST116';
      
      const notificacoesParaCriar = [];
      
      for (const cronograma of cronogramas) {
        if (tabelaNotificacoesExiste) {
          // Criar notificação na tabela de notificações
          notificacoesParaCriar.push({
            tipo: 'manutencao_programada',
            titulo: `Manutenção ${cronograma.tipo_manutencao} programada`,
            mensagem: `Manutenção ${cronograma.tipo_manutencao} programada para ${cronograma.proxima_manutencao}. Contrato: ${cronograma.contrato.numero}`,
            data_programada: cronograma.proxima_manutencao,
            contrato_id: cronograma.contrato_id,
            cliente_id: cronograma.contrato.cliente_id,
            lida: false,
            prioridade: cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media'
          });
        } else {
          // Criar notificação como ticket
          notificacoesParaCriar.push({
            cliente_id: cronograma.contrato.cliente_id,
            contrato_id: cronograma.contrato_id,
            titulo: `AVISO: Manutenção ${cronograma.tipo_manutencao} em breve`,
            descricao: `Manutenção ${cronograma.tipo_manutencao} programada para ${cronograma.proxima_manutencao}. Contrato: ${cronograma.contrato.numero}. Por favor, prepare-se com antecedência.`,
            tipo: 'manutencao',
            prioridade: 'baixa',
            status: 'pendente'
          });
        }
      }
      
      if (notificacoesParaCriar.length > 0) {
        const tabela = tabelaNotificacoesExiste ? 'notificacoes' : 'tickets';
        const { error } = await supabase
          .from(tabela)
          .insert(notificacoesParaCriar);
        
        if (error) {
          console.error(`Erro ao criar notificações em lote na tabela ${tabela}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificações em lote:', error);
      // Não propagar o erro para não interromper o fluxo principal
    }
  },

  // ✅ DEPRECATED: Criar ticket de manutenção (substituído por processamento em lote)
  async criarTicketManutencao(cronograma: any): Promise<Ticket> {
    console.warn('⚠️ criarTicketManutencao está deprecated. Use gerarTicketsManutencao()');
    try {
      const supabase = createSupabaseClient();
      
      const ticket = {
        cliente_id: cronograma.contrato.cliente_id,
        contrato_id: cronograma.contrato_id,
        titulo: `Manutenção ${cronograma.tipo_manutencao} - ${cronograma.contrato.numero}`,
        descricao: `Manutenção ${cronograma.tipo_manutencao} agendada para ${cronograma.proxima_manutencao}. Contrato: ${cronograma.contrato.numero}`,
        tipo: 'manutencao',
        prioridade: cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media',
        status: 'pendente'
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticket)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar ticket de manutenção:', error);
        throw new Error(`Erro ao criar ticket: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Exceção ao criar ticket de manutenção:', error);
      throw error;
    }
  },

  // ✅ DEPRECATED: Atualizar próxima manutenção (substituído por processamento em lote)
  async atualizarProximaManutencao(cronogramaId: string, frequencia: string): Promise<void> {
    console.warn('⚠️ atualizarProximaManutencao está deprecated. Use gerarTicketsManutencao()');
    try {
      const supabase = createSupabaseClient();
      
      // Calcular próxima data baseada na frequência
      const hoje = new Date();
      const proximaData = this.calcularProximaData(hoje, frequencia);
      
      const { error } = await supabase
        .from('cronograma_manutencao')
        .update({
          proxima_manutencao: proximaData,
          ultima_manutencao: hoje.toISOString().split('T')[0]
        })
        .eq('id', cronogramaId);
      
      if (error) {
        console.error('Erro ao atualizar próxima manutenção:', error);
        throw new Error(`Erro ao atualizar cronograma: ${error.message}`);
      }
    } catch (error) {
      console.error('Exceção ao atualizar próxima manutenção:', error);
      throw error;
    }
  },

  // ✅ NOVO: Atualizar cronograma de manutenção
  async atualizarCronogramaManutencao(cronogramaId: string, dados: {
    tipo_manutencao?: string;
    frequencia?: string;
    proxima_manutencao?: string;
  }): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('cronograma_manutencao')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', cronogramaId);
      
      if (error) {
        console.error('Erro ao atualizar cronograma:', error);
        throw new Error(`Erro ao atualizar cronograma: ${error.message}`);
      }
    } catch (error) {
      console.error('Exceção ao atualizar cronograma:', error);
      throw error;
    }
  },

  // ✅ NOVO: Deletar cronograma de manutenção
  async deletarCronogramaManutencao(cronogramaId: string): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('cronograma_manutencao')
        .delete()
        .eq('id', cronogramaId);
      
      if (error) {
        console.error('Erro ao deletar cronograma:', error);
        throw new Error(`Erro ao deletar cronograma: ${error.message}`);
      }
    } catch (error) {
      console.error('Exceção ao deletar cronograma:', error);
      throw error;
    }
  },

  // ✅ NOVO: Obter cronograma de manutenção por contrato
  async getCronogramaManutencao(contratoId: string): Promise<CronogramaManutencao[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('cronograma_manutencao')
        .select(`
          *,
          contrato:contratos(*)
        `)
        .eq('contrato_id', contratoId)
        .order('proxima_manutencao', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar cronograma por contrato:', error);
        throw new Error(`Erro ao buscar cronograma: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Exceção ao buscar cronograma por contrato:', error);
      throw error;
    }
  },

  // Obter histórico de manutenção
  async getHistoricoManutencao(contratoId?: string): Promise<HistoricoManutencao[]> {
    try {
      const supabase = createSupabaseClient();
      
      let query = supabase
        .from('historico_manutencao')
        .select(`
          *,
          contrato:contratos(*),
          ticket:tickets(*)
        `)
        .order('data_realizada', { ascending: false });
      
      if (contratoId) {
        query = query.eq('contrato_id', contratoId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar histórico:', error);
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Exceção ao buscar histórico:', error);
      throw error;
    }
  },

  // Registrar manutenção no histórico
  async registrarManutencao(contratoId: string, ticketId: string, tipoManutencao: string, observacoes?: string): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      const registro = {
        contrato_id: contratoId,
        ticket_id: ticketId,
        tipo_manutencao: tipoManutencao,
        data_realizada: new Date().toISOString().split('T')[0],
        observacoes
      };
      
      const { error } = await supabase
        .from('historico_manutencao')
        .insert(registro);
      
      if (error) {
        console.error('Erro ao registrar manutenção:', error);
        throw new Error(`Erro ao registrar manutenção: ${error.message}`);
      }
    } catch (error) {
      console.error('Exceção ao registrar manutenção:', error);
      throw error;
    }
  },

  // ✅ DEPRECATED: Criar notificação para manutenção programada (substituído por criarNotificacoesEmLote)
  async criarNotificacaoManutencao(cronograma: any): Promise<void> {
    console.warn('⚠️ criarNotificacaoManutencao está deprecated. Use criarNotificacoesEmLote()');
    try {
      const supabase = createSupabaseClient();
      
      // Verificar se já existe uma tabela de notificações
      const { error: tableError } = await supabase
        .from('notificacoes')
        .select('id')
        .limit(1);
      
      // Se a tabela não existir, não gerar erro, apenas registrar no console
      if (tableError && tableError.code === 'PGRST116') {
        console.log('Tabela de notificações não encontrada. Criando notificação alternativa...');
        
        // Alternativa: Criar um ticket com status 'pendente'
        const notificacaoTicket = {
          cliente_id: cronograma.contrato.cliente_id,
          contrato_id: cronograma.contrato_id,
          titulo: `AVISO: Manutenção ${cronograma.tipo_manutencao} em breve`,
          descricao: `Manutenção ${cronograma.tipo_manutencao} programada para ${cronograma.proxima_manutencao}. Contrato: ${cronograma.contrato.numero}. Por favor, prepare-se com antecedência.`,
          tipo: 'manutencao',
          prioridade: 'baixa',
          status: 'pendente'
        };
        
        const { error } = await supabase
          .from('tickets')
          .insert(notificacaoTicket);
        
        if (error) {
          console.error('Erro ao criar notificação como ticket:', error);
        }
        
        return;
      }
      
      // Se a tabela existir, criar notificação
      const notificacao = {
        tipo: 'manutencao_programada',
        titulo: `Manutenção ${cronograma.tipo_manutencao} programada`,
        mensagem: `Manutenção ${cronograma.tipo_manutencao} programada para ${cronograma.proxima_manutencao}. Contrato: ${cronograma.contrato.numero}`,
        data_programada: cronograma.proxima_manutencao,
        contrato_id: cronograma.contrato_id,
        cliente_id: cronograma.contrato.cliente_id,
        lida: false,
        prioridade: cronograma.tipo_manutencao === 'corretiva' ? 'alta' : 'media'
      };
      
      const { error } = await supabase
        .from('notificacoes')
        .insert(notificacao);
      
      if (error) {
        console.error('Erro ao criar notificação de manutenção:', error);
        throw new Error(`Erro ao criar notificação: ${error.message}`);
      }
    } catch (error) {
      console.error('Exceção ao criar notificação de manutenção:', error);
      // Não propagar o erro para não interromper o fluxo principal
      // apenas registrar no console
    }
  },

  // Rastreamento de técnicos em tempo real
  async updateTecnicoLocation(location: { 
    tecnico_id: string; 
    latitude: number; 
    longitude: number; 
    accuracy?: number;
    timestamp: string 
  }): Promise<unknown> {
    try {
      console.log('📍 Atualizando localização para tecnico_id:', location.tecnico_id);
      console.log('📍 Dados:', { 
        lat: location.latitude, 
        lng: location.longitude, 
        accuracy: location.accuracy,
        timestamp: location.timestamp 
      });
      
      const supabase = createSupabaseClient();
      
      // Primeiro, verificar se o usuário existe
      const { data: userExists, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', location.tecnico_id)
        .single();
      
      if (userError || !userExists) {
        console.error('❌ Usuário não encontrado:', location.tecnico_id);
        throw new Error(`Usuário com ID ${location.tecnico_id} não encontrado`);
      }
      
      // Usar upsert para evitar problemas de unique constraint
      const locationData: any = {
        tecnico_id: location.tecnico_id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        updated_at: new Date().toISOString(),
      };

      // Adicionar accuracy apenas se fornecido
      if (location.accuracy !== undefined) {
        locationData.accuracy = location.accuracy;
      }

      const { data: upsertData, error: upsertError } = await supabase
        .from('tecnico_locations')
        .upsert(locationData, {
          onConflict: 'tecnico_id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('❌ Erro do Supabase (upsert):', upsertError);
        
        // Se for erro de RLS, tentar sem accuracy
        if (upsertError.message.includes('row-level security') && location.accuracy !== undefined) {
          console.log('🔄 Tentando upsert sem accuracy devido a RLS...');
          const { data: retryData, error: retryError } = await supabase
            .from('tecnico_locations')
            .upsert({
              tecnico_id: location.tecnico_id,
              latitude: location.latitude,
              longitude: location.longitude,
              timestamp: location.timestamp,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'tecnico_id'
            })
            .select()
            .single();

          if (retryError) {
            throw new Error(`Falha ao fazer upsert (sem accuracy): ${retryError.message}`);
          }

          console.log('✅ Localização atualizada sem accuracy para:', location.tecnico_id);
          return retryData;
        }
        
        throw new Error(`Falha ao atualizar localização: ${upsertError.message}`);
      }
      
      console.log('✅ Localização atualizada com sucesso para:', location.tecnico_id);
      return upsertData;
    } catch (error) {
      console.error('❌ Exceção ao atualizar localização:', error);
      
      // Verificar se é um erro de tabela não existente
      if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new Error('Tabela tecnico_locations não existe. Execute o script SQL para criar a tabela.');
      }
      
      // Verificar se é um erro de permissão
      if (error instanceof Error && error.message.includes('permission')) {
        throw new Error('Sem permissão para atualizar localização. Verifique as políticas RLS.');
      }
      
      // Verificar se é um erro de foreign key
      if (error instanceof Error && error.message.includes('foreign key')) {
        throw new Error('Erro de foreign key. Verifique se o usuário existe na tabela users.');
      }
      
      // Verificar se é um erro de unique constraint
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        throw new Error('Erro de unique constraint. O técnico já possui uma localização registrada. Tente novamente.');
      }
      
      // Erro genérico
      throw new Error(`Falha ao atualizar localização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  },

  async getTecnicoLocation(tecnico_id: string): Promise<any> {
    try {
      // Não precisamos mais validar se é UUID, pois agora é TEXT
      
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('tecnico_locations')
        .select('*')
        .eq('tecnico_id', tecnico_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignora erro se não encontrar
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      throw error;
    }
  },

  async getAllTecnicoLocations(): Promise<any> {
    try {
      const supabase = createSupabaseClient();
      
      // Usando a join explícita para evitar problemas de tipo
      const { data, error } = await supabase
        .from('tecnico_locations')
        .select(`
          *,
          users!tecnico_locations_tecnico_id_fkey (
            id,
            name,
            email
          )
        `)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Erro na consulta SQL:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
      throw error;
    }
  },
};