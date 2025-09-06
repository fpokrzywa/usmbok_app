-- Location: supabase/migrations/20250906053041_fix_assistants_state_column_type.sql
-- Schema Analysis: Fixing boolean to text column type conversion for assistants.state
-- Integration Type: Modification - Column type change with RLS policy updates  
-- Dependencies: Existing assistants table, existing RLS policies

-- Step 1: Drop RLS policies that depend on the 'state' column
DROP POLICY IF EXISTS "public_can_read_assistants" ON public.assistants;
DROP POLICY IF EXISTS "authenticated_users_read_all_assistants" ON public.assistants;

-- Step 2: Convert the boolean column to text with proper data transformation
-- Convert true -> 'Active', false -> 'Inactive'
ALTER TABLE public.assistants 
ALTER COLUMN state TYPE TEXT 
USING CASE 
    WHEN state = true THEN 'Active'
    WHEN state = false THEN 'Inactive'
    ELSE 'Inactive'
END;

-- Step 3: Set default value for new records
ALTER TABLE public.assistants 
ALTER COLUMN state SET DEFAULT 'Active';

-- Step 4: Add constraint to ensure only valid values
ALTER TABLE public.assistants 
ADD CONSTRAINT assistants_state_check 
CHECK (state IN ('Active', 'Inactive'));

-- Step 5: Update the index to work with text values
DROP INDEX IF EXISTS idx_assistants_state;
CREATE INDEX idx_assistants_state ON public.assistants(state);

-- Step 6: Recreate RLS policies with proper string comparisons
-- Public users can only read active assistants
CREATE POLICY "public_can_read_assistants"
ON public.assistants
FOR SELECT
TO public
USING (state = 'Active');

-- Authenticated users can read all assistants regardless of state
CREATE POLICY "authenticated_users_read_all_assistants"
ON public.assistants
FOR SELECT
TO authenticated
USING (true);

-- Admin users can manage all assistants (if admin functionality exists)
CREATE POLICY "admin_full_access_assistants"
ON public.assistants
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() 
        AND up.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() 
        AND up.role = 'admin'
    )
);

-- Step 7: Update any existing data to ensure consistency
UPDATE public.assistants 
SET state = 'Active' 
WHERE state IS NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.assistants.state IS 'Assistant state: Active or Inactive (converted from boolean)';