-- Location: supabase/migrations/20250906002724_update_domain_codes_clean_data.sql
-- Schema Analysis: Domain column is ENUM (domain_type), not TEXT - needs conversion first
-- Integration Type: Schema modification + data cleanup for USM codes
-- Dependencies: assistants table with domain_type enum

-- Step 1: First convert domain column from ENUM to TEXT (fixes the constraint issue)
-- Backup existing data
CREATE TEMPORARY TABLE _temp_assistant_domains AS
SELECT id, domain::text as old_domain FROM public.assistants;

-- Drop existing domain column and constraints
DROP INDEX IF EXISTS idx_assistants_domain;
ALTER TABLE public.assistants DROP COLUMN IF EXISTS domain;

-- Add new TEXT domain column
ALTER TABLE public.assistants 
ADD COLUMN domain TEXT NOT NULL DEFAULT 'USMXXX';

-- Step 2: Restore and map existing enum values to USM codes
UPDATE public.assistants 
SET domain = CASE 
    WHEN t.old_domain = 'usmbok' THEN 'USMXXX'
    WHEN t.old_domain = 'service_consumer_management' THEN 'USM1XX'
    WHEN t.old_domain = 'service_strategy_management' THEN 'USM2XX'
    WHEN t.old_domain = 'service_performance_management' THEN 'USM3XX'
    WHEN t.old_domain = 'service_experience_management' THEN 'USM4XX'
    WHEN t.old_domain = 'service_delivery_management' THEN 'USM5XX'
    WHEN t.old_domain = 'service_operations_management' THEN 'USM6XX'
    WHEN t.old_domain = 'service_value_management' THEN 'USM7XX'
    WHEN t.old_domain = 'intelligent_automation' THEN 'USM8XX'
    WHEN t.old_domain = 'service_infrastructure_management' THEN 'USM9XX'
    WHEN t.old_domain = 'itil' THEN 'ITIL'
    WHEN t.old_domain = 'it4it' THEN 'IT4IT'
    WHEN t.old_domain = 'technology' THEN 'TECH'
    WHEN t.old_domain = 'healthcare' THEN 'HLTH'
    WHEN t.old_domain = 'finance' THEN 'FINC'
    WHEN t.old_domain = 'legal' THEN 'LEGL'
    WHEN t.old_domain = 'marketing' THEN 'MKTG'
    WHEN t.old_domain = 'education' THEN 'EDUC'
    WHEN t.old_domain = 'research' THEN 'RSRH'
    WHEN t.old_domain = 'business' THEN 'BSNS'
    ELSE 'USMXXX'
END
FROM _temp_assistant_domains t
WHERE public.assistants.id = t.id;

-- Step 3: Handle specific cases based on name/knowledge_bank
-- Update Service Operations Management specifically to USM5XX (if not already set)
UPDATE public.assistants 
SET domain = 'USM5XX'
WHERE (name ILIKE '%Service Operations Management%' 
       OR knowledge_bank ILIKE '%Service Operations Management%'
       OR name ILIKE '%Operations%')
   AND domain != 'USM5XX';

-- Step 4: Additional cleanup based on assistant names (for better accuracy)
UPDATE public.assistants 
SET domain = CASE 
    WHEN name ILIKE '%USMBOK%' OR knowledge_bank ILIKE '%USMBOK%' THEN 'USMXXX'
    WHEN name ILIKE '%Consumer%' OR knowledge_bank ILIKE '%Consumer%' THEN 'USM1XX'
    WHEN name ILIKE '%Strategy%' OR knowledge_bank ILIKE '%Strategy%' THEN 'USM2XX'
    WHEN name ILIKE '%Performance%' OR knowledge_bank ILIKE '%Performance%' THEN 'USM3XX'
    WHEN name ILIKE '%Experience%' OR knowledge_bank ILIKE '%Experience%' THEN 'USM4XX'
    WHEN name ILIKE '%Delivery%' OR knowledge_bank ILIKE '%Delivery%' THEN 'USM5XX'
    WHEN name ILIKE '%Operations%' OR knowledge_bank ILIKE '%Operations%' THEN 'USM6XX'
    WHEN name ILIKE '%Value%' OR knowledge_bank ILIKE '%Value%' THEN 'USM7XX'
    WHEN name ILIKE '%Automation%' OR knowledge_bank ILIKE '%Automation%' THEN 'USM8XX'
    WHEN name ILIKE '%Infrastructure%' OR knowledge_bank ILIKE '%Infrastructure%' THEN 'USM9XX'
    WHEN name ILIKE '%ITIL%' OR knowledge_bank ILIKE '%ITIL%' THEN 'ITIL'
    WHEN name ILIKE '%IT4IT%' OR knowledge_bank ILIKE '%IT4IT%' THEN 'IT4IT'
    ELSE domain  -- Keep existing domain if no pattern matches
END;

-- Step 5: Recreate index and constraints
CREATE INDEX idx_assistants_domain ON public.assistants(domain);

-- Add constraint for valid domain codes
ALTER TABLE public.assistants 
ADD CONSTRAINT chk_assistants_domain_valid 
CHECK (
    domain IN ('USMXXX', 'USM1XX', 'USM2XX', 'USM3XX', 'USM4XX', 
               'USM5XX', 'USM6XX', 'USM7XX', 'USM8XX', 'USM9XX', 
               'ITIL', 'IT4IT', 'TECH', 'HLTH', 'FINC', 'LEGL', 
               'MKTG', 'EDUC', 'RSRH', 'BSNS')
);

-- Step 6: Update triggers to handle new TEXT domain column
DROP TRIGGER IF EXISTS log_assistant_changes_trigger ON public.assistants;
CREATE TRIGGER log_assistant_changes_trigger
    AFTER INSERT OR UPDATE ON public.assistants
    FOR EACH ROW EXECUTE FUNCTION log_assistant_changes();

-- Step 7: Add helpful column comment
COMMENT ON COLUMN public.assistants.domain IS 
'Domain codes: USM1XX-USM9XX for service management domains, USMXXX for general USMBOK, ITIL/IT4IT for frameworks, others for general domains';

-- Step 8: Verify the conversion and cleanup
DO $$
DECLARE
    total_count integer;
    usm5xx_count integer;
    null_count integer;
BEGIN
    SELECT COUNT(*) INTO total_count FROM public.assistants;
    SELECT COUNT(*) INTO usm5xx_count FROM public.assistants WHERE domain = 'USM5XX';
    SELECT COUNT(*) INTO null_count FROM public.assistants WHERE domain IS NULL OR domain = '';
    
    RAISE NOTICE 'Domain codes conversion completed successfully:';
    RAISE NOTICE '- Total assistants: %', total_count;
    RAISE NOTICE '- Service Operations (USM5XX): %', usm5xx_count;
    RAISE NOTICE '- Invalid/null domains: %', null_count;
    
    IF null_count > 0 THEN
        RAISE WARNING 'Some assistants still have null/empty domain values - manual review needed';
    END IF;
END $$;

-- Cleanup temporary table
DROP TABLE IF EXISTS _temp_assistant_domains;