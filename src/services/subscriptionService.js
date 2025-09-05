import { supabase } from '../lib/supabase';

export const subscriptionService = {
  // Get current user's subscription details
  async getCurrentSubscription(userId) {
    const { data, error } = await supabase?.rpc('get_user_subscription_details', { 
      user_uuid: userId 
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  // Get all available subscription plans
  async getSubscriptionPlans() {
    const { data, error } = await supabase
      ?.from('subscription_plans')?.select('*')?.eq('is_active', true)?.order('price_usd', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Change subscription plan
  async changeSubscriptionPlan(userId, newTier, paymentMethod = 'card') {
    try {
      // First simulate the change
      const { data: simulationId, error: simError } = await supabase?.rpc('simulate_subscription_change', {
        user_uuid: userId,
        new_tier: newTier,
        payment_method: paymentMethod
      });

      if (simError) throw simError;

      // Get the plan details
      const { data: plan, error: planError } = await supabase
        ?.from('subscription_plans')?.select('*')?.eq('tier', newTier)?.eq('is_active', true)
        ?.single();

      if (planError) throw planError;

      // Update user subscription
      const { data: subscription, error: subError } = await supabase
        ?.from('user_subscriptions')
        ?.upsert({
          user_id: userId,
          plan_id: plan?.id,
          tier: newTier,
          status: 'active',
          credits_per_month: plan?.credits_per_month,
          price_paid: plan?.price_usd,
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)?.toISOString(), // 30 days from now
          updated_at: new Date()?.toISOString()
        })
        ?.select()
        ?.single();

      if (subError) throw subError;

      // Mark simulation as completed
      await supabase
        ?.from('billing_simulations')
        ?.update({ 
          payment_status: 'completed',
          processed_at: new Date()?.toISOString()
        })
        ?.eq('id', simulationId);

      // Log the plan change
      await supabase?.from('subscription_plan_changes')?.insert({
        user_id: userId,
        to_plan_id: plan?.id,
        to_tier: newTier,
        change_reason: 'User-initiated upgrade',
        processed_by: userId
      });

      return subscription;
    } catch (error) {
      console.error('Error changing subscription plan:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(userId, reason = 'User requested cancellation') {
    const { data, error } = await supabase
      ?.from('user_subscriptions')
      ?.update({
        status: 'cancelled',
        cancellation_date: new Date()?.toISOString(),
        cancellation_reason: reason,
        auto_renewal: false,
        updated_at: new Date()?.toISOString()
      })
      ?.eq('user_id', userId)?.eq('is_active', true)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Pause subscription
  async pauseSubscription(userId) {
    const { data, error } = await supabase
      ?.from('user_subscriptions')
      ?.update({
        status: 'paused',
        updated_at: new Date()?.toISOString()
      })
      ?.eq('user_id', userId)?.eq('is_active', true)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Resume subscription
  async resumeSubscription(userId) {
    const { data, error } = await supabase
      ?.from('user_subscriptions')
      ?.update({
        status: 'active',
        updated_at: new Date()?.toISOString()
      })
      ?.eq('user_id', userId)?.eq('is_active', true)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Get subscription plan changes history
  async getSubscriptionHistory(userId, limit = 10) {
    const { data, error } = await supabase
      ?.from('subscription_plan_changes')?.select(`*,from_plan:subscription_plans!from_plan_id(name, tier),to_plan:subscription_plans!to_plan_id(name, tier),processed_by_user:user_profiles!processed_by(full_name)`)?.eq('user_id', userId)?.order('created_at', { ascending: false })
      ?.limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get billing simulations
  async getBillingSimulations(userId, limit = 5) {
    const { data, error } = await supabase
      ?.from('billing_simulations')?.select('*')?.eq('user_id', userId)?.order('created_at', { ascending: false })
      ?.limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Update subscription renewal settings
  async updateRenewalSettings(userId, autoRenewal) {
    const { data, error } = await supabase
      ?.from('user_subscriptions')
      ?.update({
        auto_renewal: autoRenewal,
        updated_at: new Date()?.toISOString()
      })
      ?.eq('user_id', userId)?.eq('is_active', true)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Get subscription analytics (admin only)
  async getSubscriptionAnalytics() {
    const { data: subscriptions, error } = await supabase
      ?.from('user_subscriptions')?.select(`*,user:user_profiles(id, full_name, email)`)?.eq('is_active', true);

    if (error) throw error;

    const analytics = {
      totalSubscriptions: subscriptions?.length || 0,
      activeSubscriptions: subscriptions?.filter(s => s?.status === 'active')?.length || 0,
      trialSubscriptions: subscriptions?.filter(s => s?.status === 'trial')?.length || 0,
      cancelledSubscriptions: subscriptions?.filter(s => s?.status === 'cancelled')?.length || 0,
      byTier: {},
      totalMRR: 0
    };

    // Group by tier
    subscriptions?.forEach(sub => {
      const tier = sub?.tier;
      if (!analytics?.byTier?.[tier]) {
        analytics.byTier[tier] = {
          count: 0,
          revenue: 0
        };
      }
      analytics.byTier[tier].count += 1;
      if (sub?.status === 'active') {
        analytics.byTier[tier].revenue += parseFloat(sub?.price_paid || 0);
        analytics.totalMRR += parseFloat(sub?.price_paid || 0);
      }
    });

    return analytics;
  }
};

export default subscriptionService;