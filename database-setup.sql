-- 4Save - Sistema de Gestão Técnica
-- Arquivo SQL Consolidado - Setup Completo do Banco de Dados
-- Execute este arquivo no Query Editor do Supabase

-- ========================================
-- LIMPEZA INICIAL (OPCIONAL)
-- ========================================

-- Remover triggers existentes para evitar conflitos
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
DROP TRIGGER IF EXISTS update_contratos_updated_at ON contratos;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
DROP TRIGGER IF EXISTS update_relatorios_updated_at ON relatorios_tecnicos;

-- ========================================
-- CRIAÇÃO DAS TABELAS
-- ========================================

-- Tabela de usuários (inclui administradores e técnicos)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admin', 'tecnico')),
  especialidade TEXT,
  telefone TEXT,
  status TEXT CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  disponibilidade BOOLEAN DEFAULT true,
  avaliacao DECIMAL(3,2) CHECK (avaliacao >= 0 AND avaliacao <= 5),
  localizacao_gps TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  numero TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  equipamentos TEXT[] DEFAULT '{}',
  tipo_produto TEXT CHECK (tipo_produto IN ('solar_baterias', 'solar', 'baterias', 'furo_agua', 'tratamento_agua')) DEFAULT 'solar_baterias',
  segmento TEXT CHECK (segmento IN ('domestico', 'industrial', 'outro')) DEFAULT 'domestico',
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo', 'vencido')) DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  tecnico_id UUID REFERENCES users(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('instalacao', 'manutencao')) DEFAULT 'manutencao',
  prioridade TEXT NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')) DEFAULT 'media',
  status TEXT NOT NULL CHECK (status IN ('pendente', 'em_curso', 'finalizado', 'cancelado')) DEFAULT 'pendente',
  motivo_cancelamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relatórios técnicos
CREATE TABLE IF NOT EXISTS relatorios_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  tecnico_id UUID REFERENCES users(id) ON DELETE CASCADE,
  observacoes_iniciais TEXT,
  diagnostico TEXT,
  acoes_realizadas TEXT,
  fotos_antes TEXT[] DEFAULT '{}',
  fotos_depois TEXT[] DEFAULT '{}',
  assinatura_cliente TEXT,
  assinatura_tecnico TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_finalizacao TIMESTAMP WITH TIME ZONE,
  tempo_execucao INTEGER,
  tipo_produto TEXT,
  localizacao_gps TEXT,
  dados_especificos JSONB,
  checklist_completo BOOLEAN DEFAULT false,
  fotos_minimas_atingidas BOOLEAN DEFAULT false,
  tempo_dentro_limite BOOLEAN DEFAULT false,
  aprovado_admin BOOLEAN DEFAULT false,
  feedback_cliente INTEGER CHECK (feedback_cliente >= 1 AND feedback_cliente <= 5),
  observacoes_qualidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_tickets_cliente_id ON tickets(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contrato_id ON tickets(contrato_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tecnico_id ON tickets(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_prioridade ON tickets(prioridade);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);

CREATE INDEX IF NOT EXISTS idx_relatorios_ticket_id ON relatorios_tecnicos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_tecnico_id ON relatorios_tecnicos(tecnico_id);

CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relatorios_updated_at BEFORE UPDATE ON relatorios_tecnicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios_tecnicos ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS DE SEGURANÇA
-- ========================================

-- Políticas para usuários
DROP POLICY IF EXISTS "Allow service role full access" ON users;
CREATE POLICY "Allow service role full access" ON users FOR ALL USING (true);

-- Políticas para clientes
DROP POLICY IF EXISTS "Allow service role full access" ON clientes;
CREATE POLICY "Allow service role full access" ON clientes FOR ALL USING (true);

-- Políticas para contratos
DROP POLICY IF EXISTS "Allow service role full access" ON contratos;
CREATE POLICY "Allow service role full access" ON contratos FOR ALL USING (true);

-- Políticas para tickets
DROP POLICY IF EXISTS "Allow service role full access" ON tickets;
CREATE POLICY "Allow service role full access" ON tickets FOR ALL USING (true);

-- Políticas para relatórios
DROP POLICY IF EXISTS "Allow service role full access" ON relatorios_tecnicos;
CREATE POLICY "Allow service role full access" ON relatorios_tecnicos FOR ALL USING (true);

-- ========================================
-- MIGRAÇÃO: ADICIONAR COLUNAS FALTANTES
-- ========================================

-- Adicionar colunas à tabela users (se não existirem)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS disponibilidade BOOLEAN DEFAULT true;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avaliacao DECIMAL(3,2) CHECK (avaliacao >= 0 AND avaliacao <= 5);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS localizacao_gps TEXT;

-- Novas colunas para controle de online/offline
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Adicionar colunas à tabela relatorios_tecnicos (se não existirem)
ALTER TABLE relatorios_tecnicos 
ADD COLUMN IF NOT EXISTS checklist_completo BOOLEAN DEFAULT false;

ALTER TABLE relatorios_tecnicos 
ADD COLUMN IF NOT EXISTS fotos_minimas_atingidas BOOLEAN DEFAULT false;

ALTER TABLE relatorios_tecnicos 
ADD COLUMN IF NOT EXISTS tempo_dentro_limite BOOLEAN DEFAULT false;

ALTER TABLE relatorios_tecnicos 
ADD COLUMN IF NOT EXISTS aprovado_admin BOOLEAN DEFAULT false;

ALTER TABLE relatorios_tecnicos 
ADD COLUMN IF NOT EXISTS feedback_cliente INTEGER CHECK (feedback_cliente >= 1 AND feedback_cliente <= 5);

ALTER TABLE relatorios_tecnicos 
ADD COLUMN IF NOT EXISTS observacoes_qualidade TEXT;

-- ========================================
-- ATUALIZAR DADOS EXISTENTES
-- ========================================

-- Atualizar técnicos existentes para ter disponibilidade = true
UPDATE users 
SET disponibilidade = true 
WHERE type = 'tecnico' AND disponibilidade IS NULL;

-- Atualizar técnicos existentes para ter avaliação padrão
UPDATE users 
SET avaliacao = 4.0 
WHERE type = 'tecnico' AND avaliacao IS NULL;

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Inserir usuário administrador padrão
INSERT INTO users (id, email, name, password, type, status) 
VALUES ('1', 'admin@4save.com', 'Administrador', 'admin123', 'admin', 'ativo')
ON CONFLICT (email) DO NOTHING;

-- Inserir técnico de exemplo
INSERT INTO users (id, email, name, password, type, especialidade, telefone, status, disponibilidade, avaliacao) 
VALUES ('2', 'tecnico@4save.com', 'João Silva', 'tecnico123', 'tecnico', 'Solar', '+351 123 456 789', 'ativo', true, 4.5)
ON CONFLICT (email) DO NOTHING;

-- Inserir cliente de exemplo
INSERT INTO clientes (nome, email, telefone, endereco) 
VALUES ('Maria Santos', 'maria@email.com', '+351 987 654 321', 'Rua das Flores, 123, Lisboa')
ON CONFLICT DO NOTHING;

-- Inserir contrato de exemplo
INSERT INTO contratos (cliente_id, numero, descricao, valor, data_inicio, data_fim, tipo_produto, segmento)
SELECT 
  c.id,
  'CON-2024-001',
  'Instalação Solar Residencial',
  5000.00,
  '2024-01-01',
  '2024-12-31',
  'solar_baterias',
  'domestico'
FROM clientes c 
WHERE c.email = 'maria@email.com'
ON CONFLICT DO NOTHING;

-- Inserir ticket de exemplo
INSERT INTO tickets (cliente_id, contrato_id, tecnico_id, titulo, descricao, tipo, prioridade, status)
SELECT 
  c.id,
  co.id,
  u.id,
  'Instalação Painéis Solares',
  'Instalação de sistema solar com baterias',
  'instalacao',
  'media',
  'pendente'
FROM clientes c 
JOIN contratos co ON c.id = co.cliente_id
JOIN users u ON u.email = 'tecnico@4save.com'
WHERE c.email = 'maria@email.com'
ON CONFLICT DO NOTHING;

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON COLUMN tickets.motivo_cancelamento IS 'Motivo do cancelamento do ticket';
COMMENT ON COLUMN relatorios_tecnicos.tempo_execucao IS 'Tempo de execução em segundos';
COMMENT ON COLUMN relatorios_tecnicos.assinatura_tecnico IS 'Assinatura digital do técnico (base64)';
COMMENT ON COLUMN relatorios_tecnicos.tipo_produto IS 'Tipo de produto do contrato';
COMMENT ON COLUMN relatorios_tecnicos.localizacao_gps IS 'Coordenadas GPS da localização';
COMMENT ON COLUMN relatorios_tecnicos.dados_especificos IS 'Dados específicos do formulário por tipo de produto';

-- Comentários para novas colunas de controle de qualidade
COMMENT ON COLUMN users.disponibilidade IS 'Indica se o técnico está disponível para novos tickets';
COMMENT ON COLUMN users.avaliacao IS 'Avaliação do técnico (0-5)';
COMMENT ON COLUMN users.localizacao_gps IS 'Última localização GPS do técnico';
COMMENT ON COLUMN users.last_seen IS 'Última vez que o usuário esteve online';
COMMENT ON COLUMN users.is_online IS 'Indica se o usuário está online no momento';
COMMENT ON COLUMN relatorios_tecnicos.checklist_completo IS 'Indica se o checklist foi completado';
COMMENT ON COLUMN relatorios_tecnicos.fotos_minimas_atingidas IS 'Indica se foram tiradas fotos mínimas (2 antes, 2 depois)';
COMMENT ON COLUMN relatorios_tecnicos.tempo_dentro_limite IS 'Indica se o tempo de execução está dentro do limite (4h)';
COMMENT ON COLUMN relatorios_tecnicos.aprovado_admin IS 'Indica se o relatório foi aprovado pelo admin';
COMMENT ON COLUMN relatorios_tecnicos.feedback_cliente IS 'Avaliação do cliente (1-5)';
COMMENT ON COLUMN relatorios_tecnicos.observacoes_qualidade IS 'Observações sobre a qualidade do relatório';

-- ========================================
-- VERIFICAÇÃO DA CONFIGURAÇÃO
-- ========================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'clientes', 'contratos', 'tickets', 'relatorios_tecnicos')
ORDER BY tablename;

-- Verificar contagem de registros
SELECT 
    'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 
    'clientes' as tabela, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 
    'contratos' as tabela, COUNT(*) as registros FROM contratos
UNION ALL
SELECT 
    'tickets' as tabela, COUNT(*) as registros FROM tickets
UNION ALL
SELECT 
    'relatorios_tecnicos' as tabela, COUNT(*) as registros FROM relatorios_tecnicos;

-- ========================================
-- FINALIZAÇÃO
-- ========================================

-- Confirmar configuração
SELECT 'Configuração do banco 4Save concluída com sucesso!' as status; 