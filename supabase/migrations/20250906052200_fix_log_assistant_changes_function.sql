-- Fix log_assistant_changes function to use correct column name and string values
-- Location: supabase/migrations/20250906052200_fix_log_assistant_changes_function.sql
-- Issue: Function references non-existent "is_active" column, should use "state" column
-- Schema: assistants table has "state" column as TEXT with values 'Active'/'Inactive'

-- Drop and recreate the log_assistant_changes function with correct column references
CREATE OR REPLACE FUNCTION public.log_assistant_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Handle INSERT (new assistant)
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_admin_activity(
            'assistant_created'::public.activity_type,
            'assistant',
            'New assistant created: ' || NEW.name,
            NEW.id,
            NULL,
            jsonb_build_object(
                'domain', NEW.domain,
                'credits_per_message', NEW.credits_per_message,
                'state', NEW.state
            )
        );
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Log activation status changes (now using string values)
        IF OLD.state != NEW.state THEN
            IF NEW.state = 'Active' THEN
                PERFORM public.log_admin_activity(
                    'assistant_activated'::public.activity_type,
                    'assistant',
                    'Assistant activated: ' || NEW.name,
                    NEW.id,
                    NULL,
                    jsonb_build_object('domain', NEW.domain)
                );
            ELSE
                PERFORM public.log_admin_activity(
                    'assistant_deactivated'::public.activity_type,
                    'assistant',
                    'Assistant deactivated: ' || NEW.name,
                    NEW.id,
                    NULL,
                    jsonb_build_object('domain', NEW.domain)
                );
            END IF;
        END IF;
        
        -- Log general updates (unchanged logic, just fixed column reference in metadata)
        IF OLD.name != NEW.name OR OLD.description != NEW.description OR OLD.credits_per_message != NEW.credits_per_message THEN
            PERFORM public.log_admin_activity(
                'assistant_updated'::public.activity_type,
                'assistant',
                'Assistant updated: ' || NEW.name,
                NEW.id,
                NULL,
                jsonb_build_object(
                    'old_credits_per_message', OLD.credits_per_message,
                    'new_credits_per_message', NEW.credits_per_message,
                    'domain', NEW.domain,
                    'state', NEW.state
                )
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$function$;

-- Comment: Function updated to use correct column name 'state' instead of 'is_active'
-- The function now properly handles string values 'Active'/'Inactive' instead of boolean
-- All trigger functionality preserved with corrected column references