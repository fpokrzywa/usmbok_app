-- Location: supabase/migrations/20250905195739_convert_user_subscriptions_to_table.sql
-- Schema Analysis: Existing user_subscriptions is a VIEW that needs to be converted to table
-- Integration Type: Enhancement - Convert VIEW to proper table and add subscription system
-- Dependencies: user_profiles (existing)

-- Step 1: Store existing data before dropping view
CREATE TEMP TABLE temp_user_subscriptions_backup AS 
SELECT * FROM public.user_subscriptions;

-- Step 2: Drop existing view if it exists (not table)
DROP VIEW IF EXISTS public.user_subscriptions CASCADE;

-- Step 3: Create subscription-related enums
DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'cancelled', 'expired', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'yearly', 'unlimited');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_tier AS ENUM ('registered', 'subscriber', 'founder', 'unlimited', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier public.subscription_tier NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    credits_per_month INTEGER NOT NULL DEFAULT 0,
    billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
    trial_days INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Create proper user_subscriptions table
CREATE TABLE public.user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status public.subscription_status NOT NULL DEFAULT 'trial',
    tier public.subscription_tier NOT NULL DEFAULT 'registered',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    cancellation_date TIMESTAMPTZ,
    cancellation_reason TEXT,
    trial_days_remaining INTEGER DEFAULT 30,
    auto_renewal BOOLEAN DEFAULT true,
    price_paid DECIMAL(10,2) DEFAULT 0.00,
    credits_per_month INTEGER DEFAULT 100000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Step 6: Create subscription plan changes tracking
CREATE TABLE IF NOT EXISTS public.subscription_plan_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    from_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    to_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    from_tier public.subscription_tier,
    to_tier public.subscription_tier NOT NULL,
    change_reason TEXT,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Create billing simulations table
CREATE TABLE IF NOT EXISTS public.billing_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tier public.subscription_tier NOT NULL,
    simulated_price DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'card',
    payment_status public.payment_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON public.user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_changes_user_id ON public.subscription_plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_simulations_user_id ON public.billing_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON public.subscription_plans(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans(is_active);

-- Step 9: Create functions for subscription management
CREATE OR REPLACE FUNCTION public.get_user_subscription_details(user_uuid UUID)
RETURNS TABLE (
    subscription_id BIGINT,
    user_id UUID,
    tier TEXT,
    status TEXT,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    trial_days_remaining INTEGER,
    credits_per_month INTEGER,
    price_paid DECIMAL(10,2),
    plan_name TEXT,
    plan_description TEXT,
    is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT 
    us.id as subscription_id,
    us.user_id,
    us.tier::TEXT,
    us.status::TEXT,
    us.started_at,
    us.expires_at,
    us.next_billing_date,
    us.trial_days_remaining,
    us.credits_per_month,
    us.price_paid,
    sp.name as plan_name,
    sp.description as plan_description,
    us.is_active
FROM public.user_subscriptions us
LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = user_uuid
AND us.is_active = true
ORDER BY us.created_at DESC
LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.simulate_subscription_change(
    user_uuid UUID,
    new_tier TEXT,
    payment_method TEXT DEFAULT 'card'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    simulation_id UUID;
    plan_price DECIMAL(10,2);
BEGIN
    -- Get plan price
    SELECT price_usd INTO plan_price
    FROM public.subscription_plans
    WHERE tier = new_tier::public.subscription_tier
    AND is_active = true
    LIMIT 1;
    
    -- Create billing simulation
    INSERT INTO public.billing_simulations (
        id, user_id, tier, simulated_price, payment_method
    ) VALUES (
        gen_random_uuid(), user_uuid, new_tier::public.subscription_tier, 
        COALESCE(plan_price, 0.00), payment_method
    ) RETURNING id INTO simulation_id;
    
    RETURN simulation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Step 10: Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_simulations ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies with safety checks
DO $$ BEGIN
    CREATE POLICY "public_can_read_subscription_plans"
    ON public.subscription_plans
    FOR SELECT
    TO public
    USING (is_active = true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "users_manage_own_user_subscriptions"
    ON public.user_subscriptions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "users_view_own_subscription_plan_changes"
    ON public.subscription_plan_changes
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "users_manage_own_billing_simulations"
    ON public.billing_simulations
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 12: Create admin policies using auth metadata
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

DO $$ BEGIN
    CREATE POLICY "admin_full_access_subscription_plans"
    ON public.subscription_plans
    FOR ALL
    TO authenticated
    USING (public.is_admin_from_auth())
    WITH CHECK (public.is_admin_from_auth());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "admin_view_all_user_subscriptions"
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (public.is_admin_from_auth());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "admin_view_all_subscription_plan_changes"
    ON public.subscription_plan_changes
    FOR ALL
    TO authenticated
    USING (public.is_admin_from_auth())
    WITH CHECK (public.is_admin_from_auth());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 13: Create triggers with safety checks
DO $$ BEGIN
    CREATE TRIGGER update_user_subscriptions_updated_at
        BEFORE UPDATE ON public.user_subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION public.update_subscription_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_subscription_plans_updated_at
        BEFORE UPDATE ON public.subscription_plans
        FOR EACH ROW
        EXECUTE FUNCTION public.update_subscription_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 14: Insert default subscription plans and migrate existing data
DO $$
DECLARE
    registered_plan_id UUID;
BEGIN
    -- Insert default subscription plans
    INSERT INTO public.subscription_plans (
        name, tier, price_usd, credits_per_month, billing_cycle, 
        trial_days, features, description, is_active
    ) VALUES
        (
            'Registered User', 
            'registered', 
            0.00, 
            100000, 
            'unlimited', 
            30, 
            '["Basic AI chat access", "30-day trial period", "100,000 credits per month", "Community support"]'::jsonb,
            'Free access to basic AI chat features with trial credits',
            true
        ),
        (
            'Subscriber Plan', 
            'subscriber', 
            19.99, 
            500000, 
            'monthly', 
            0, 
            '["Unlimited AI chat access", "Priority support", "500,000 credits per month", "Advanced features", "No trial limitations"]'::jsonb,
            'Monthly subscription with expanded credit allowance',
            true
        ),
        (
            'Founder Plan', 
            'founder', 
            49.99, 
            2000000, 
            'monthly', 
            0, 
            '["All Subscriber features", "Premium priority support", "2,000,000 credits per month", "Early access to new features", "Founder badge"]'::jsonb,
            'Premium plan for early supporters and power users',
            true
        ),
        (
            'Unlimited Plan', 
            'unlimited', 
            99.99, 
            1000000000, 
            'monthly', 
            0, 
            '["Unlimited everything", "White-glove support", "No credit limits", "All features included", "Custom integrations", "Priority feature requests"]'::jsonb,
            'Enterprise-level unlimited access to all platform features',
            true
        )
    ON CONFLICT DO NOTHING;
    
    -- Get registered plan ID
    SELECT id INTO registered_plan_id 
    FROM public.subscription_plans 
    WHERE tier = 'registered' 
    LIMIT 1;
    
    -- Migrate existing view data to table format
    INSERT INTO public.user_subscriptions (
        user_id, 
        tier, 
        status, 
        trial_days_remaining, 
        credits_per_month,
        plan_id,
        is_active,
        created_at,
        updated_at
    )
    SELECT 
        backup.user_id,
        'registered'::public.subscription_tier,
        'trial'::public.subscription_status,
        30, -- Default trial days
        COALESCE(backup.credits_per_month, 100000),
        registered_plan_id,
        COALESCE(backup.is_active, true),
        COALESCE(backup.created_at, CURRENT_TIMESTAMP),
        COALESCE(backup.updated_at, CURRENT_TIMESTAMP)
    FROM temp_user_subscriptions_backup backup
    WHERE backup.user_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    -- Create subscriptions for users who don't have any
    INSERT INTO public.user_subscriptions (
        user_id, 
        tier, 
        status, 
        trial_days_remaining, 
        credits_per_month,
        plan_id
    )
    SELECT 
        up.id,
        'registered'::public.subscription_tier,
        'trial'::public.subscription_status,
        30,
        100000,
        registered_plan_id
    FROM public.user_profiles up
    LEFT JOIN public.user_subscriptions us ON up.id = us.user_id
    WHERE us.id IS NULL  -- Only create if no subscription exists
    AND registered_plan_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Some subscription plans already exist, skipping duplicates';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating default data: %', SQLERRM;
END $$;

-- Step 15: Drop temporary backup table
DROP TABLE IF EXISTS temp_user_subscriptions_backup;