-- Schema Analysis: Fix assistants table state constraints and data consistency
-- Integration Type: Modificative - Fix existing table constraints and data
-- Dependencies: assistants table

-- Fix 1: Remove any problematic check constraints
ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS assistants_state_check;
ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS assistants_state_valid;

-- Fix 2: Ensure state column allows the values being used in the application
ALTER TABLE public.assistants 
ALTER COLUMN state SET DEFAULT 'Active'::TEXT;

-- Fix 3: Add proper check constraint that matches application usage
ALTER TABLE public.assistants 
ADD CONSTRAINT assistants_state_valid 
CHECK (state IN ('Active', 'Inactive'));

-- Fix 4: Update any existing null or invalid state values
UPDATE public.assistants 
SET state = 'Active' 
WHERE state IS NULL OR state NOT IN ('Active', 'Inactive');

-- Fix 5: Ensure the state column is properly indexed for performance
DROP INDEX IF EXISTS idx_assistants_state;
CREATE INDEX idx_assistants_state ON public.assistants(state);

-- Fix 6: Update the log_assistant_changes function to handle the corrected state field
CREATE OR REPLACE FUNCTION public.log_assistant_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log changes to admin activity log
    INSERT INTO public.admin_activity_log (
        admin_user_id,
        entity_type,
        entity_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        COALESCE(
            (SELECT id FROM public.user_profiles WHERE role = 'admin' LIMIT 1),
            (SELECT id FROM auth.users LIMIT 1)
        ),
        'assistant',
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'assistant_created'::public.activity_type
            WHEN TG_OP = 'UPDATE' THEN 'assistant_updated'::public.activity_type
            WHEN TG_OP = 'DELETE' THEN 'assistant_deactivated'::public.activity_type
            ELSE 'assistant_updated'::public.activity_type
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'New assistant created: ' || NEW.name
            WHEN TG_OP = 'UPDATE' THEN 'Assistant updated: ' || NEW.name || ' - State: ' || NEW.state
            WHEN TG_OP = 'DELETE' THEN 'Assistant deleted: ' || OLD.name
            ELSE 'Assistant modified'
        END,
        jsonb_build_object(
            'assistant_name', COALESCE(NEW.name, OLD.name),
            'state', COALESCE(NEW.state, OLD.state),
            'domain', COALESCE(NEW.domain, OLD.domain),
            'knowledge_bank', COALESCE(NEW.knowledge_bank, OLD.knowledge_bank),
            'operation', TG_OP,
            'timestamp', NOW()
        )
    );
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but do not fail the main operation
        RAISE NOTICE 'Failed to log assistant changes: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$;