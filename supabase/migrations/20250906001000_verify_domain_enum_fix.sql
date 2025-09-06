-- Verify and complete domain enum values fix
-- This ensures all domain values in the assistants table match the correct USM codes

-- Update any remaining incorrect domain mappings
UPDATE public.assistants 
SET domain = 'service_operations_management'::public.domain_type
WHERE name LIKE '%Operations%' 
  AND domain != 'service_operations_management'::public.domain_type;

UPDATE public.assistants 
SET domain = 'service_delivery_management'::public.domain_type
WHERE name LIKE '%Delivery%' 
  AND domain != 'service_delivery_management'::public.domain_type;

UPDATE public.assistants 
SET domain = 'service_infrastructure_management'::public.domain_type
WHERE name LIKE '%Infrastructure%' 
  AND domain != 'service_infrastructure_management'::public.domain_type;

-- Add comprehensive documentation for domain mapping
COMMENT ON TYPE public.domain_type IS 'FIXED: Domain types for USM knowledge areas with correct USM code mapping:
USMXXX = usmbok (Universal Service Management Body of Knowledge)
USM1XX = service_consumer_management (Service Consumer Management)  
USM2XX = service_strategy_management (Service Strategy Management)
USM3XX = service_performance_management (Service Performance Management)
USM4XX = service_experience_management (Service Experience Management)
USM5XX = service_delivery_management (Service Delivery Management)
USM6XX = service_operations_management (Service Operations Management) 
USM7XX = service_value_management (Service Value Management)
USM8XX = intelligent_automation (Intelligent Automation)
USM9XX = service_infrastructure_management (Service Infrastructure Management)
Additional: itil (ITIL Framework), it4it (IT4IT Architecture)
Legacy: technology, healthcare, finance, legal, marketing, education, research, business';

-- Verify the fix by selecting current domain mappings
-- This will help confirm all domains are correctly mapped
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current domain mappings in assistants table:';
    FOR rec IN 
        SELECT name, domain, 
               CASE domain::text
                   WHEN 'usmbok' THEN 'USMXXX'
                   WHEN 'service_consumer_management' THEN 'USM1XX'
                   WHEN 'service_strategy_management' THEN 'USM2XX' 
                   WHEN 'service_performance_management' THEN 'USM3XX'
                   WHEN 'service_experience_management' THEN 'USM4XX'
                   WHEN 'service_delivery_management' THEN 'USM5XX'
                   WHEN 'service_operations_management' THEN 'USM6XX'
                   WHEN 'service_value_management' THEN 'USM7XX'
                   WHEN 'intelligent_automation' THEN 'USM8XX'
                   WHEN 'service_infrastructure_management' THEN 'USM9XX'
                   ELSE domain::text
               END as usm_code
        FROM public.assistants 
        ORDER BY name
    LOOP
        RAISE NOTICE '%: % (% Code)', rec.name, rec.domain, rec.usm_code;
    END LOOP;
END $$;