-- Script para criar tabelas de geolocalização dos técnicos
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela tecnico_locations
CREATE TABLE IF NOT EXISTS public.tecnico_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tecnico_id TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 10,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para melhor performance
    CONSTRAINT tecnico_locations_tecnico_id_fkey 
        FOREIGN KEY (tecnico_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tecnico_locations_tecnico_id ON public.tecnico_locations(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_tecnico_locations_timestamp ON public.tecnico_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tecnico_locations_updated_at ON public.tecnico_locations(updated_at DESC);

-- 3. Criar função RPC para upsert de localização
CREATE OR REPLACE FUNCTION public.upsert_tecnico_location(
    p_tecnico_id TEXT,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_accuracy DOUBLE PRECISION DEFAULT 10,
    p_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Inserir ou atualizar localização
    INSERT INTO public.tecnico_locations (
        tecnico_id, 
        latitude, 
        longitude, 
        accuracy, 
        timestamp, 
        updated_at
    ) VALUES (
        p_tecnico_id, 
        p_latitude, 
        p_longitude, 
        p_accuracy, 
        p_timestamp, 
        NOW()
    )
    ON CONFLICT (tecnico_id) 
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW()
    RETURNING to_json(tecnico_locations.*) INTO result;
    
    RETURN result;
END;
$$;

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE public.tecnico_locations ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
-- Política para técnicos verem apenas suas próprias localizações
CREATE POLICY "Técnicos podem ver suas próprias localizações" ON public.tecnico_locations
    FOR SELECT USING (auth.uid()::text = tecnico_id);

-- Política para técnicos atualizarem suas próprias localizações
CREATE POLICY "Técnicos podem atualizar suas próprias localizações" ON public.tecnico_locations
    FOR INSERT WITH CHECK (auth.uid()::text = tecnico_id);

CREATE POLICY "Técnicos podem atualizar suas próprias localizações" ON public.tecnico_locations
    FOR UPDATE USING (auth.uid()::text = tecnico_id);

-- Política para admins verem todas as localizações
CREATE POLICY "Admins podem ver todas as localizações" ON public.tecnico_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 6. Criar função para buscar localizações com dados do usuário
CREATE OR REPLACE FUNCTION public.get_tecnico_locations_with_users()
RETURNS TABLE (
    tecnico_id TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    timestamp TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_name TEXT,
    user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tl.tecnico_id,
        tl.latitude,
        tl.longitude,
        tl.accuracy,
        tl.timestamp,
        tl.updated_at,
        u.name as user_name,
        u.email as user_email
    FROM public.tecnico_locations tl
    LEFT JOIN public.users u ON u.id = tl.tecnico_id
    ORDER BY tl.updated_at DESC;
END;
$$;

-- 7. Criar função para limpar localizações antigas (mais de 7 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_locations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.tecnico_locations 
    WHERE updated_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 8. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tecnico_locations_updated_at 
    BEFORE UPDATE ON public.tecnico_locations 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Comentários para documentação
COMMENT ON TABLE public.tecnico_locations IS 'Tabela para armazenar localizações em tempo real dos técnicos';
COMMENT ON COLUMN public.tecnico_locations.tecnico_id IS 'ID do técnico (referência para auth.users)';
COMMENT ON COLUMN public.tecnico_locations.latitude IS 'Latitude da localização';
COMMENT ON COLUMN public.tecnico_locations.longitude IS 'Longitude da localização';
COMMENT ON COLUMN public.tecnico_locations.accuracy IS 'Precisão da localização em metros';
COMMENT ON COLUMN public.tecnico_locations.timestamp IS 'Timestamp da captura da localização';
COMMENT ON COLUMN public.tecnico_locations.updated_at IS 'Timestamp da última atualização no banco';

-- 10. Verificar se tudo foi criado corretamente
SELECT 
    'tecnico_locations' as table_name,
    COUNT(*) as row_count
FROM public.tecnico_locations
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as row_count
FROM public.users;
