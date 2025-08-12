-- Função para upsert de localização de técnico
-- Pode contornar problemas de tipo ao usar uma função específica

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
