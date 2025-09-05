-- Location: supabase/migrations/20250905201244_fix_user_management_admin_access.sql
-- Schema Analysis: Existing user_profiles, user_credits, user_subscriptions tables with restrictive RLS
-- Integration Type: Enhancement - Adding admin access and syncing missing users
-- Dependencies: user_profiles, user_credits, user_subscriptions, auth.users

-- 1. Create admin access function that checks both user_profiles and email
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE au.id = auth.uid() 
    AND (up.role = 'admin' OR au.email = 'ian@ianmclayton.com')
);
$$;

-- 2. Add admin access policies for user_profiles
DROP POLICY IF EXISTS "admin_view_all_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_view_all_user_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Keep existing policy for users managing their own profiles
-- users_manage_own_user_profiles already exists, no need to recreate

-- 3. Add admin access policies for user_credits  
DROP POLICY IF EXISTS "admin_view_all_user_credits" ON public.user_credits;
CREATE POLICY "admin_view_all_user_credits"
ON public.user_credits
FOR ALL
TO authenticated  
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 4. Enhance existing admin policy for user_subscriptions (already exists but ensure it works)
-- admin_view_all_user_subscriptions policy already exists using is_admin_from_auth()
-- Add a backup admin policy using our new function
DROP POLICY IF EXISTS "admin_manage_all_user_subscriptions" ON public.user_subscriptions;
CREATE POLICY "admin_manage_all_user_subscriptions" 
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 5. Create function to sync auth.users with user_profiles
CREATE OR REPLACE FUNCTION public.sync_missing_user_profiles()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sync_count INTEGER := 0;
    auth_user RECORD;
BEGIN
    -- Insert missing user profiles from auth.users
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
        FROM auth.users au
        LEFT JOIN public.user_profiles up ON au.id = up.id
        WHERE up.id IS NULL
    LOOP
        INSERT INTO public.user_profiles (id, email, full_name, role, created_at)
        VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE(
                auth_user.raw_user_meta_data->>'full_name',
                CASE 
                    WHEN auth_user.email = 'ian@ianmclayton.com' THEN 'Ian Clayton'
                    ELSE split_part(auth_user.email, '@', 1)
                END
            ),
            CASE 
                WHEN auth_user.email = 'ian@ianmclayton.com' THEN 'admin'::public.user_role
                ELSE 'member'::public.user_role
            END,
            auth_user.created_at
        );
        sync_count := sync_count + 1;
    END LOOP;
    
    RETURN sync_count;
END;
$$;

-- 6. Create function to sync user credits for missing users
CREATE OR REPLACE FUNCTION public.sync_missing_user_credits()
RETURNS INTEGER  
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sync_count INTEGER := 0;
    user_profile RECORD;
BEGIN
    -- Insert missing user credits for existing user profiles
    FOR user_profile IN
        SELECT up.id
        FROM public.user_profiles up
        LEFT JOIN public.user_credits uc ON up.id = uc.user_id
        WHERE uc.user_id IS NULL
    LOOP
        INSERT INTO public.user_credits (user_id, balance, created_at, updated_at)
        VALUES (
            user_profile.id,
            200100,  -- Default credits like Ian Clayton shown in attachment
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        sync_count := sync_count + 1;
    END LOOP;
    
    RETURN sync_count;
END;
$$;

-- 7. Create function to sync user subscriptions for missing users
CREATE OR REPLACE FUNCTION public.sync_missing_user_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql  
SECURITY DEFINER
AS $$
DECLARE
    sync_count INTEGER := 0;
    user_profile RECORD;
    default_plan_id UUID;
BEGIN
    -- Get the default plan ID (registered tier)
    SELECT id INTO default_plan_id 
    FROM public.subscription_plans 
    WHERE tier = 'registered'::public.subscription_tier 
    LIMIT 1;
    
    -- Insert missing user subscriptions for existing user profiles  
    FOR user_profile IN
        SELECT up.id
        FROM public.user_profiles up
        LEFT JOIN public.user_subscriptions us ON up.id = us.user_id
        WHERE us.user_id IS NULL
    LOOP
        INSERT INTO public.user_subscriptions (
            user_id, tier, status, plan_id, is_active, 
            credits_per_month, price_paid, started_at, 
            trial_days_remaining, created_at, updated_at
        )
        VALUES (
            user_profile.id,
            'registered'::public.subscription_tier,
            'trial'::public.subscription_status, 
            default_plan_id,
            true,
            100000,
            0.00,
            CURRENT_TIMESTAMP,
            30,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        sync_count := sync_count + 1;
    END LOOP;
    
    RETURN sync_count;
END;
$$;

-- 8. Execute the sync functions to populate missing data
DO $$
DECLARE
    profiles_synced INTEGER;
    credits_synced INTEGER;  
    subscriptions_synced INTEGER;
BEGIN
    -- Sync missing user profiles
    SELECT public.sync_missing_user_profiles() INTO profiles_synced;
    RAISE NOTICE 'Synced % missing user profiles', profiles_synced;
    
    -- Sync missing user credits
    SELECT public.sync_missing_user_credits() INTO credits_synced;
    RAISE NOTICE 'Synced % missing user credits', credits_synced;
    
    -- Sync missing user subscriptions  
    SELECT public.sync_missing_user_subscriptions() INTO subscriptions_synced;
    RAISE NOTICE 'Synced % missing user subscriptions', subscriptions_synced;
    
    -- Ensure Ian Clayton has admin role
    UPDATE public.user_profiles 
    SET role = 'admin'::public.user_role, full_name = 'Ian Clayton'
    WHERE email = 'ian@ianmclayton.com';
    
    RAISE NOTICE 'User management admin access configuration completed';
END $$;

-- 9. Create cleanup function for this migration (for testing)
CREATE OR REPLACE FUNCTION public.cleanup_user_management_sync()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
BEGIN
    -- This function can be used to cleanup sync operations if needed
    -- For now, it's a placeholder for future cleanup operations
    RAISE NOTICE 'User management cleanup function created';
END;
$$;