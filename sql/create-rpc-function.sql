-- Função RPC para buscar localizações de técnicos com dados do usuário
-- Esta função é usada pelo admin dashboard para mostrar técnicos no mapa

CREATE OR REPLACE FUNCTION public.get_tecnico_locations_with_users()
RETURNS TABLE (
    tecnico_id TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    name TEXT,
    email TEXT,
    especialidade TEXT,
    is_online BOOLEAN,
    last_seen TIMESTAMP WITH TIME ZONE,
    disponibilidade BOOLEAN
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
        u.name,
        u.email,
        u.especialidade,
        u.is_online,
        u.last_seen,
        u.disponibilidade
    FROM public.tecnico_locations tl
    INNER JOIN public.users u ON tl.tecnico_id = u.id
    WHERE u.type = 'tecnico'
    ORDER BY tl.updated_at DESC;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.get_tecnico_locations_with_users() IS 'Retorna localizações de técnicos com dados do usuário para o admin dashboard';

-- Garantir que a função seja executável por usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_tecnico_locations_with_users() TO authenticated;
