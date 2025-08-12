-- 4Save - Migrações para Sistema de Online/Offline
-- Execute este arquivo no Query Editor do Supabase

-- ========================================
-- MIGRAÇÕES PARA SISTEMA DE ONLINE/OFFLINE
-- ========================================

-- Adicionar colunas para controle de online/offline
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Adicionar comentários para documentação
COMMENT ON COLUMN users.last_seen IS 'Última vez que o usuário esteve online';
COMMENT ON COLUMN users.is_online IS 'Indica se o usuário está online no momento';

-- Atualizar técnicos existentes para ter valores padrão
UPDATE users 
SET 
  last_seen = NOW(),
  is_online = false
WHERE type = 'tecnico' AND last_seen IS NULL;

-- Criar índice para melhorar performance das consultas de online
CREATE INDEX IF NOT EXISTS idx_users_online_status 
ON users(type, status, is_online, disponibilidade);

-- Criar índice para consultas por last_seen
CREATE INDEX IF NOT EXISTS idx_users_last_seen 
ON users(last_seen) WHERE type = 'tecnico';

-- ========================================
-- MIGRAÇÕES PARA SISTEMA DE MANUTENÇÃO
-- ========================================

-- Adicionar campo de plano de manutenção aos contratos
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS plano_manutencao JSONB;

-- Adicionar campos de vídeo aos relatórios técnicos
ALTER TABLE relatorios_tecnicos ADD COLUMN IF NOT EXISTS videos_antes TEXT[] DEFAULT '{}';
ALTER TABLE relatorios_tecnicos ADD COLUMN IF NOT EXISTS videos_depois TEXT[] DEFAULT '{}';
ALTER TABLE relatorios_tecnicos ADD COLUMN IF NOT EXISTS fotos_manutencao TEXT[] DEFAULT '{}';
ALTER TABLE relatorios_tecnicos ADD COLUMN IF NOT EXISTS videos_manutencao TEXT[] DEFAULT '{}';

-- Criar tabela de cronograma de manutenção
CREATE TABLE IF NOT EXISTS cronograma_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  tipo_manutencao TEXT NOT NULL CHECK (tipo_manutencao IN ('preventiva', 'corretiva', 'preditiva')),
  frequencia TEXT NOT NULL CHECK (frequencia IN ('mensal', 'trimestral', 'semestral', 'anual')),
  proxima_manutencao DATE NOT NULL,
  ultima_manutencao DATE,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de histórico de manutenção
CREATE TABLE IF NOT EXISTS historico_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  tipo_manutencao TEXT NOT NULL,
  data_agendada DATE,
  data_realizada DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_cronograma_contrato_id ON cronograma_manutencao(contrato_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_proxima_manutencao ON cronograma_manutencao(proxima_manutencao);
CREATE INDEX IF NOT EXISTS idx_cronograma_status ON cronograma_manutencao(status);

CREATE INDEX IF NOT EXISTS idx_historico_contrato_id ON historico_manutencao(contrato_id);
CREATE INDEX IF NOT EXISTS idx_historico_ticket_id ON historico_manutencao(ticket_id);
CREATE INDEX IF NOT EXISTS idx_historico_data_realizada ON historico_manutencao(data_realizada);

-- ========================================
-- COMENTÁRIOS NAS TABELAS
-- ========================================

COMMENT ON COLUMN contratos.plano_manutencao IS 'Configuração do plano de manutenção do contrato';
COMMENT ON COLUMN relatorios_tecnicos.videos_antes IS 'Vídeos do estado antes da intervenção';
COMMENT ON COLUMN relatorios_tecnicos.videos_depois IS 'Vídeos do estado após a intervenção';
COMMENT ON COLUMN relatorios_tecnicos.fotos_manutencao IS 'Fotos durante o processo de manutenção';
COMMENT ON COLUMN relatorios_tecnicos.videos_manutencao IS 'Vídeos durante o processo de manutenção';

COMMENT ON TABLE cronograma_manutencao IS 'Cronograma de manutenções programadas';
COMMENT ON TABLE historico_manutencao IS 'Histórico de manutenções realizadas';

-- ========================================
-- VERIFICAÇÃO DAS MIGRAÇÕES
-- ========================================

-- Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('last_seen', 'is_online')
ORDER BY column_name;

-- Verificar dados dos técnicos
SELECT 
  id,
  name,
  type,
  status,
  disponibilidade,
  is_online,
  last_seen
FROM users 
WHERE type = 'tecnico'
ORDER BY name; 