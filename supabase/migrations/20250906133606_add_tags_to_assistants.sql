-- Location: supabase/migrations/20250906133606_add_tags_to_assistants.sql
-- Schema Analysis: Existing assistants table with complete structure
-- Integration Type: Enhancement - adding tags column for search optimization
-- Dependencies: public.assistants (existing table)

-- Add tags column to existing assistants table for search optimization
ALTER TABLE public.assistants
ADD COLUMN tags TEXT;

-- Add index for tags column to improve search performance
CREATE INDEX idx_assistants_tags ON public.assistants USING gin(to_tsvector('english', COALESCE(tags, '')));

-- Add comment for documentation
COMMENT ON COLUMN public.assistants.tags IS 'Free-format text field for search optimization and categorization';