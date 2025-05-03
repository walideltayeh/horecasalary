
-- Create a function to log deletions
CREATE OR REPLACE FUNCTION public.log_deletion(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_deleted_by UUID,
  p_entity_data JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.deletion_logs(entity_type, entity_id, deleted_by, entity_data)
  VALUES (p_entity_type, p_entity_id, p_deleted_by, p_entity_data);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create a function to get deletion logs
CREATE OR REPLACE FUNCTION public.get_deletion_logs(
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL
) RETURNS SETOF public.deletion_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_entity_type IS NOT NULL AND p_entity_id IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.deletion_logs
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id
    ORDER BY deleted_at DESC;
  ELSIF p_entity_type IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.deletion_logs
    WHERE entity_type = p_entity_type
    ORDER BY deleted_at DESC;
  ELSIF p_entity_id IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.deletion_logs
    WHERE entity_id = p_entity_id
    ORDER BY deleted_at DESC;
  ELSE
    RETURN QUERY
    SELECT * FROM public.deletion_logs
    ORDER BY deleted_at DESC;
  END IF;
END;
$$;

-- Create a function to get a deleted cafe
CREATE OR REPLACE FUNCTION public.get_deleted_cafe(
  p_cafe_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cafe_data JSONB;
BEGIN
  SELECT entity_data INTO cafe_data
  FROM public.deletion_logs
  WHERE entity_type = 'cafe' AND entity_id = p_cafe_id
  ORDER BY deleted_at DESC
  LIMIT 1;
  
  RETURN cafe_data;
END;
$$;
