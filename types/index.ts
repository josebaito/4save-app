export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  type: 'admin' | 'tecnico';
  especialidade?: string; // Para técnicos
  telefone?: string; // Para técnicos
  status?: 'ativo' | 'inativo'; // Para técnicos
  disponibilidade?: boolean; // Para técnicos - se está disponível para novos tickets
  avaliacao?: number; // Para técnicos - rating médio (1-5)
  localizacao_gps?: string; // Para técnicos - última localização conhecida
  last_seen?: string; // Última atividade do usuário
  is_online?: boolean; // Status real de online/offline
  created_at: string;
  updated_at: string;
}

// Não precisamos mais da interface Tecnico separada
// pois usamos User com type='tecnico'

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cnpj?: string;
  created_at: string;
  updated_at: string;
}

export interface Contrato {
  id: string;
  cliente_id: string;
  numero: string;
  descricao: string;
  valor: number;
  data_inicio: string;
  data_fim: string;
  equipamentos: string[];
  tipo_produto: 'solar_baterias' | 'solar' | 'baterias' | 'furo_agua' | 'tratamento_agua';
  segmento: 'domestico' | 'industrial' | 'outro';
  status: 'ativo' | 'inativo' | 'vencido';
  plano_manutencao?: PlanoManutencao; // ✅ NOVO: Plano de manutenção
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
}

export interface Ticket {
  id: string;
  cliente_id: string;
  contrato_id: string;
  tecnico_id?: string;
  titulo: string;
  descricao: string;
  tipo: 'instalacao' | 'manutencao';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_curso' | 'finalizado' | 'cancelado';
  motivo_cancelamento?: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  contrato?: Contrato;
  tecnico?: User; // Agora referencia User ao invés de Tecnico
  relatorio?: RelatorioTecnico;
}

export interface RelatorioTecnico {
  id: string;
  ticket_id: string;
  tecnico_id: string;
  observacoes_iniciais?: string;
  diagnostico?: string;
  acoes_realizadas?: string;
  fotos_antes?: string[];
  fotos_depois?: string[];
  videos_antes?: string[]; // ✅ NOVO: Vídeos antes da intervenção
  videos_depois?: string[]; // ✅ NOVO: Vídeos após a intervenção
  fotos_manutencao?: string[]; // ✅ NOVO: Fotos durante manutenção
  videos_manutencao?: string[]; // ✅ NOVO: Vídeos durante manutenção
  assinatura_cliente?: string;
  assinatura_tecnico?: string;
  data_inicio?: string;
  data_finalizacao?: string;
  tempo_execucao?: number; // Tempo em segundos
  tipo_produto?: string;
  localizacao_gps?: string;
  dados_especificos?: Record<string, any>;
  // Controle de qualidade
  checklist_completo?: boolean;
  fotos_minimas_atingidas?: boolean;
  tempo_dentro_limite?: boolean;
  aprovado_admin?: boolean;
  feedback_cliente?: number; // 1-5
  observacoes_qualidade?: string;
  created_at: string;
  updated_at: string;
  ticket?: Ticket;
  tecnico?: User; // Agora referencia User ao invés de Tecnico
}

// ✅ NOVOS TIPOS PARA SISTEMA DE MANUTENÇÃO

export interface PlanoManutencao {
  tipo_manutencao: 'preventiva' | 'corretiva' | 'preditiva';
  frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  inicio_manutencao: string; // Data após instalação
  duracao_contrato: number; // Meses
  valor_manutencao: number;
  observacoes?: string;
}

export interface CronogramaManutencao {
  id: string;
  contrato_id: string;
  tipo_manutencao: string;
  frequencia: string;
  proxima_manutencao: string;
  ultima_manutencao?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
  contrato?: Contrato;
}

export interface HistoricoManutencao {
  id: string;
  contrato_id: string;
  ticket_id: string;
  tipo_manutencao: string;
  data_agendada?: string;
  data_realizada?: string;
  observacoes?: string;
  created_at: string;
  contrato?: Contrato;
  ticket?: Ticket;
}

export interface DashboardStats {
  total_clientes: number;
  total_contratos: number;
  total_tickets: number;
  tickets_pendentes: number;
  tickets_em_curso: number;
  tickets_finalizados: number;
  tickets_finalizados_mes: number;
  contratos_ativos: number;
  contratos_inativos: number;
  contratos_vencidos: number;
  tecnicos_ativos: number;
}

// Tipos para formulários específicos
export type TipoProduto = 'solar_baterias' | 'solar' | 'baterias' | 'furo_agua' | 'tratamento_agua';

export interface DadosEspecificosProduto {
  distancias_equipamentos: Record<string, number>;
  localizacao_gps?: string;

  // ✅ NOVO: Campos para manutenção
  fotos_antes?: string[];
  videos_antes?: string[];
  fotos_manutencao?: string[];
  videos_manutencao?: string[];
  fotos_depois?: string[];
  videos_depois?: string[];

  // Solar com Baterias
  localizacao_paineis?: string;
  fotos_paineis?: string[];
  videos_paineis?: string[];
  localizacao_inversores?: string;
  fotos_inversores?: string[];
  videos_inversores?: string[];
  localizacao_baterias?: string;
  fotos_baterias?: string[];
  videos_baterias?: string[];

  // Quadro Elétrico
  descricao_quadro_eletrico?: string;
  fotos_quadro_eletrico?: string[];
  videos_quadro_eletrico?: string[];

  // Cabos
  descricao_cabos?: string;
  fotos_cabos?: string[];
  videos_cabos?: string[];

  // Gerador
  descricao_gerador?: string;
  fotos_gerador?: string[];
  videos_gerador?: string[];

  // Furo de Água
  descricao_zona_furo?: string;
  fotos_zona_furo?: string[];
  videos_zona_furo?: string[];
  descricao_passagem_maquinas?: string;
  fotos_passagem_maquinas?: string[];
  videos_passagem_maquinas?: string[];
  descricao_trabalho_maquinas?: string;
  fotos_trabalho_maquinas?: string[];
  videos_trabalho_maquinas?: string[];
  fotos_tubagem?: string[];
  videos_tubagem?: string[];
  fotos_agua?: string[];
  videos_agua?: string[];

  // Tratamento de Água
  descricao_deposito?: string;
  fotos_deposito?: string[];
  videos_deposito?: string[];
  descricao_estacao_tratamento?: string;
  fotos_estacao_tratamento?: string[];
  videos_estacao_tratamento?: string[];
  descricao_equipamento_instalado?: string;
  fotos_equipamento_instalado?: string[];
  videos_equipamento_instalado?: string[];
  descricao_saida_agua?: string;
  fotos_saida_agua?: string[];
  videos_saida_agua?: string[];
}
