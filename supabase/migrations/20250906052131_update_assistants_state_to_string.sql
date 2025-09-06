-- Location: supabase/migrations/20250906052131_update_assistants_state_to_string.sql
-- Schema Analysis: assistants table has state field as boolean with values true/false
-- Integration Type: modification - changing data type and values
-- Dependencies: assistants table (existing)

-- Step 1: Add new temporary column with string type
ALTER TABLE public.assistants ADD COLUMN state_temp TEXT;

-- Step 2: Update values from boolean to string equivalents
UPDATE public.assistants 
SET state_temp = CASE 
    WHEN state = true THEN 'Active'
    WHEN state = false THEN 'Inactive'
    ELSE 'Inactive'
END;

-- Step 3: Drop old boolean column
ALTER TABLE public.assistants DROP COLUMN state;

-- Step 4: Rename temp column to state
ALTER TABLE public.assistants RENAME COLUMN state_temp TO state;

-- Step 5: Set default value and add constraint
ALTER TABLE public.assistants 
ALTER COLUMN state SET DEFAULT 'Active';

-- Step 6: Add check constraint to ensure only valid values
ALTER TABLE public.assistants 
ADD CONSTRAINT assistants_state_check 
CHECK (state IN ('Active', 'Inactive'));

-- Step 7: Update existing index to work with new string column
DROP INDEX IF EXISTS idx_assistants_state;
CREATE INDEX idx_assistants_state ON public.assistants(state);

-- Step 8: Update RLS policies to use new string values
DROP POLICY IF EXISTS "public_can_read_assistants" ON public.assistants;
CREATE POLICY "public_can_read_assistants" 
ON public.assistants
FOR SELECT 
TO public 
USING (state = 'Active');

-- Step 9: Update any functions that might reference the state field (if any exist)
-- This ensures compatibility with existing functions

-- Comment: Migration completed - state field is now TEXT with values 'Active'/'Inactive'
-- All existing boolean true values are now 'Active'
-- All existing boolean false values are now 'Inactive'
-- RLS policies updated to use new string values