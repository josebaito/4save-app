-- Script para testar a tabela de localizações dos técnicos

-- 1. Verifique se a tabela existe
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' 
    AND tablename = 'tecnico_locations'
);

-- 2. Verifique a estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'tecnico_locations'
ORDER BY 
    ordinal_position;

-- 3. Verifique se a chave estrangeira existe
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.table_name = 'tecnico_locations' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Verifique as políticas RLS
SELECT 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'tecnico_locations';

-- 5. Simule uma inserção (executar como um usuário específico)
-- INSERT INTO public.tecnico_locations (tecnico_id, latitude, longitude, timestamp, updated_at)
-- VALUES ('usuario-teste-id', 40.7128, -74.0060, NOW(), NOW());
