-- Location: supabase/migrations/20250906000000_fix_missing_knowledge_bank_column.sql
-- Schema Analysis: Existing assistants table with columns: id, name, domain, description, credits_per_message, is_active, created_at, updated_at
-- Integration Type: Modificative - Adding missing knowledge_bank column to assistants table
-- Dependencies: assistants table (existing)

-- Fix missing knowledge_bank column in assistants table
ALTER TABLE public.assistants 
ADD COLUMN IF NOT EXISTS knowledge_bank TEXT;

-- Add missing openai_assistant_id column as well (from the original migration)
ALTER TABLE public.assistants 
ADD COLUMN IF NOT EXISTS openai_assistant_id TEXT UNIQUE;

-- Add index for OpenAI assistant ID lookups if not exists
CREATE INDEX IF NOT EXISTS idx_assistants_openai_id ON public.assistants(openai_assistant_id);

-- Add index for knowledge_bank for better query performance
CREATE INDEX IF NOT EXISTS idx_assistants_knowledge_bank ON public.assistants(knowledge_bank);

-- Update existing records with knowledge_bank values based on domain
UPDATE public.assistants SET knowledge_bank = CASE
  WHEN domain = 'usmbok' THEN 'USMBOK'
  WHEN domain = 'service_consumer_management' THEN 'Service Consumer Management'
  WHEN domain = 'service_strategy_management' THEN 'Service Strategy Management'
  WHEN domain = 'service_performance_management' THEN 'Service Performance Management'
  WHEN domain = 'service_value_management' THEN 'Service Value Management'
  WHEN domain = 'intelligent_automation' THEN 'Intelligent Automation'
  WHEN domain = 'service_experience_management' THEN 'Service Experience Management'
  WHEN domain = 'service_delivery_management' THEN 'Service Delivery Management'
  WHEN domain = 'service_operations_management' THEN 'Service Operations Management'
  WHEN domain = 'service_infrastructure_management' THEN 'Service Infrastructure Management'
  WHEN domain = 'itil' THEN 'ITIL'
  WHEN domain = 'it4it' THEN 'IT4IT'
  ELSE 'General Knowledge'
END
WHERE knowledge_bank IS NULL;

-- Update existing records with placeholder OpenAI assistant IDs
UPDATE public.assistants SET openai_assistant_id = CASE
  WHEN domain = 'usmbok' THEN 'asst_usmbok_001'
  WHEN domain = 'service_consumer_management' THEN 'asst_scm_001'
  WHEN domain = 'service_strategy_management' THEN 'asst_ssm_001'
  WHEN domain = 'service_performance_management' THEN 'asst_spm_001'
  WHEN domain = 'service_value_management' THEN 'asst_svm_001'
  WHEN domain = 'intelligent_automation' THEN 'asst_ia_001'
  WHEN domain = 'service_experience_management' THEN 'asst_sem_001'
  WHEN domain = 'service_delivery_management' THEN 'asst_sdm_001'
  WHEN domain = 'service_operations_management' THEN 'asst_som_001'
  WHEN domain = 'service_infrastructure_management' THEN 'asst_sim_001'
  WHEN domain = 'itil' THEN 'asst_itil_001'
  WHEN domain = 'it4it' THEN 'asst_it4it_001'
  ELSE CONCAT('asst_', REPLACE(domain::TEXT, '_', ''), '_001')
END
WHERE openai_assistant_id IS NULL;

-- Verify the columns were added successfully
DO $$
DECLARE
    kb_exists BOOLEAN;
    openai_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assistants' 
        AND column_name = 'knowledge_bank'
    ) INTO kb_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assistants' 
        AND column_name = 'openai_assistant_id'
    ) INTO openai_exists;
    
    IF kb_exists AND openai_exists THEN
        RAISE NOTICE 'Successfully added knowledge_bank and openai_assistant_id columns to assistants table';
    ELSE
        RAISE NOTICE 'Warning: Some columns may not have been added properly';
    END IF;
END $$;