-- Script para limpar a tabela de localizações e recriar (útil para troubleshooting)

-- Remover a tabela se ela existir (CUIDADO: isso deleta todos os dados existentes)
DROP TABLE IF EXISTS public.tecnico_locations CASCADE;

-- Recriar a tabela
-- A tabela users tem o campo id como TEXT, então usamos TEXT aqui também
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

-- Grant para permitir acesso anônimo (geralmente necessário para aplicações com Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tecnico_locations TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.tecnico_locations_id_seq TO anon;

-- Criar função RPC para contornar problemas de tipo
CREATE OR REPLACE FUNCTION public.upsert_tecnico_location(
  p_tecnico_id TEXT,
  p_latitude DECIMAL(10, 8),
  p_longitude DECIMAL(11, 8),
  p_timestamp TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verifica se o registro já existe
  IF EXISTS (SELECT 1 FROM public.tecnico_locations WHERE tecnico_id = p_tecnico_id) THEN
    -- Atualiza o registro existente
    UPDATE public.tecnico_locations
    SET latitude = p_latitude,
        longitude = p_longitude,
        timestamp = p_timestamp::TIMESTAMPTZ,
        updated_at = NOW()
    WHERE tecnico_id = p_tecnico_id
    RETURNING to_jsonb(tecnico_locations.*) INTO result;
  ELSE
    -- Insere um novo registro
    INSERT INTO public.tecnico_locations
      (tecnico_id, latitude, longitude, timestamp, updated_at)
    VALUES
      (p_tecnico_id, p_latitude, p_longitude, p_timestamp::TIMESTAMPTZ, NOW())
    RETURNING to_jsonb(tecnico_locations.*) INTO result;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para facilitar o debug
    RAISE NOTICE 'Erro ao atualizar localização: %', SQLERRM;
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE,
      'tecnico_id', p_tecnico_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant para permitir acesso à função RPC
GRANT EXECUTE ON FUNCTION public.upsert_tecnico_location TO anon;
