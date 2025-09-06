-- Location: supabase/migrations/20250906011545_rename_is_active_to_state_fixed.sql
-- Schema Analysis: Assistants table exists with is_active column and dependent objects
-- Integration Type: modificative - renaming existing column
-- Dependencies: public_can_read_assistants policy and idx_assistants_active index depend on is_active column

-- Step 1: Drop dependent objects that reference the is_active column
DROP POLICY IF EXISTS "public_can_read_assistants" ON public.assistants;
DROP INDEX IF EXISTS idx_assistants_active;

-- Step 2: Rename the column from is_active to state
ALTER TABLE public.assistants 
RENAME COLUMN is_active TO state;

-- Step 3: Recreate the index with the new column name
CREATE INDEX idx_assistants_state ON public.assistants(state);

-- Step 4: Recreate the RLS policy with the new column name
CREATE POLICY "public_can_read_assistants"
ON public.assistants
FOR SELECT
TO public
USING (state = true);

-- Optional: Add comment to document the change
COMMENT ON COLUMN public.assistants.state IS 'Assistant active state (renamed from is_active)';