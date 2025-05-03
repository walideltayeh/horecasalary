
-- Create deletion logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    deleted_by TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    entity_data JSONB NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_deletion_logs_entity_type ON public.deletion_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_entity_id ON public.deletion_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_deleted_by ON public.deletion_logs (deleted_by);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_deleted_at ON public.deletion_logs (deleted_at);
