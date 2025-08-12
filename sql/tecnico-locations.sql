-- Script para criar a tabela de localizações dos técnicos
-- Primeiro verificamos se a tabela users existe no esquema public
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'users'
    ) THEN
        RAISE NOTICE 'Tabela users não encontrada no esquema public. Verifique o nome correto da tabela.';
    END IF;
END $$;

-- Criamos a tabela de localizações com referência explícita à tabela correta
CREATE TABLE IF NOT EXISTS public.tecnico_locations (
  id SERIAL PRIMARY KEY,
  tecnico_id TEXT NOT NULL, -- Alterado de UUID para TEXT para compatibilidade com users.id
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(tecnico_id),
  CONSTRAINT tecnico_locations_tecnico_id_fkey FOREIGN KEY (tecnico_id)
    REFERENCES public.users(id) ON DELETE CASCADE
);

-- Índice para consultas por técnico
CREATE INDEX IF NOT EXISTS idx_tecnico_locations_tecnico_id ON public.tecnico_locations(tecnico_id);

-- Permissões RLS (Row Level Security)
ALTER TABLE public.tecnico_locations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que técnicos atualizem apenas sua própria localização
CREATE POLICY tecnico_update_own_location ON public.tecnico_locations
  FOR UPDATE USING (auth.uid()::text = tecnico_id);

-- Política para permitir que técnicos insiram apenas sua própria localização
CREATE POLICY tecnico_insert_own_location ON public.tecnico_locations
  FOR INSERT WITH CHECK (auth.uid()::text = tecnico_id);

-- Política para permitir que técnicos visualizem apenas sua própria localização
CREATE POLICY tecnico_select_own_location ON public.tecnico_locations
  FOR SELECT USING (auth.uid()::text = tecnico_id);

-- Política para permitir que administradores visualizem todas as localizações
CREATE POLICY admin_select_all_locations ON public.tecnico_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::text AND users.type = 'admin'
    )
  );

-- Política para permitir que administradores atualizem todas as localizações
CREATE POLICY admin_update_all_locations ON public.tecnico_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::text AND users.type = 'admin'
    )
  );
