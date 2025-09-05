import { supabase } from '../lib/supabase';

export const userManagementService = {
  // Fetch all users with their credits and subscriptions - Enhanced for complete admin access
  async fetchAllUsers() {
    // First check if user is admin
    const { data: currentUser } = await supabase?.auth?.getUser();
    
    if (!currentUser?.user) {
      throw new Error('User not authenticated');
    }

    // Enhanced query that admins can see all users, regular users see only themselves
    const { data: userProfiles, error } = await supabase
      ?.from('user_profiles')
      ?.select(`
        *,
        user_credits (
          balance,
          updated_at
        ),
        user_subscriptions (
          tier,
          status,
          is_active,
          credits_per_month,
          created_at,
          updated_at,
          plan_id,
          subscription_plans (
            name,
            tier,
            price_usd
          )
        )
      `);

    if (error) throw error;

    // Return all users for admin (policies handle the filtering)
    // Regular users will only see their own data due to RLS policies
    return userProfiles || [];
  },

  // Update user profile information
  async updateUserProfile(userId, profileData) {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.update(profileData)
      ?.eq('id', userId)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Toggle user active status
  async toggleUserStatus(userId, isActive) {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.update({ is_active: isActive })
      ?.eq('id', userId)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Change user role
  async changeUserRole(userId, role) {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.update({ role })
      ?.eq('id', userId)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Add credits to user account
  addUserCredits: async (userId, amount, description = 'Admin credit adjustment') => {
    try {
      // Get current user for admin logging
      const { data: { user: currentUser } } = await supabase?.auth?.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Get admin user profile for logging
      const { data: adminProfile } = await supabase?.from('user_profiles')?.select('full_name, email')?.eq('id', currentUser?.id)?.single();

      const adminName = adminProfile?.full_name || adminProfile?.email || 'Unknown Admin';

      // Use the add_user_credits function
      const { data, error } = await supabase?.rpc('add_user_credits', {
        user_id: userId,
        credit_amount: amount
      });

      if (error) throw error;

      // Log admin activity with admin name
      const { error: logError } = await supabase?.from('admin_activity_log')?.insert({
          admin_user_id: currentUser?.id,
          user_id: userId,
          entity_type: 'user',
          entity_id: userId,
          activity_type: 'credit_adjustment',
          description: `${amount} credits added by ${adminName}: ${description}`,
          amount: amount,
          metadata: {
            action: 'add_credits',
            amount: amount,
            description: description,
            admin_name: adminName
          }
        });

      if (logError) console.error('Error logging admin activity:', logError);

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Deduct credits from user account
  deductUserCredits: async (userId, amount, description = 'Admin credit adjustment') => {
    try {
      // Get current user for admin logging
      const { data: { user: currentUser } } = await supabase?.auth?.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Get admin user profile for logging
      const { data: adminProfile } = await supabase?.from('user_profiles')?.select('full_name, email')?.eq('id', currentUser?.id)?.single();

      const adminName = adminProfile?.full_name || adminProfile?.email || 'Unknown Admin';

      // Use the deduct_user_credits function
      const { data, error } = await supabase?.rpc('deduct_user_credits', {
        user_id: userId,
        credit_amount: amount
      });

      if (error) throw error;

      // Log admin activity with admin name
      const { error: logError } = await supabase?.from('admin_activity_log')?.insert({
          admin_user_id: currentUser?.id,
          user_id: userId,
          entity_type: 'user',
          entity_id: userId,
          activity_type: 'credit_adjustment',
          description: `${amount} credits deducted by ${adminName}: ${description}`,
          amount: -amount,
          metadata: {
            action: 'deduct_credits',
            amount: amount,
            description: description,
            admin_name: adminName
          }
        });

      if (logError) console.error('Error logging admin activity:', logError);

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update user subscription
  async updateUserSubscription(userId, subscriptionData) {
    const { data, error } = await supabase
      ?.from('user_subscriptions')
      ?.upsert({
        user_id: userId,
        ...subscriptionData,
        updated_at: new Date()?.toISOString()
      })
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Get user credit transactions
  async getUserCreditTransactions(userId, limit = 10) {
    const { data, error } = await supabase
      ?.from('credit_transactions')
      ?.select('*')
      ?.eq('user_id', userId)
      ?.order('created_at', { ascending: false })
      ?.limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get user conversations
  async getUserConversations(userId, limit = 10) {
    const { data, error } = await supabase
      ?.from('conversations')
      ?.select('*')
      ?.eq('user_id', userId)
      ?.order('created_at', { ascending: false })
      ?.limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Bulk update users
  async bulkUpdateUsers(userIds, updates) {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.update(updates)
      ?.in('id', userIds)
      ?.select();

    if (error) throw error;
    return data;
  },

  // Delete user (soft delete by deactivating)
  async deleteUser(userId) {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.update({ 
        is_active: false,
        updated_at: new Date()?.toISOString()
      })
      ?.eq('id', userId)
      ?.select()
      ?.single();

    if (error) throw error;
    return data;
  },

  // Create new user profile
  async createUser(userData) {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.insert(userData)
      ?.select()
      ?.single();

    if (error) throw error;
    
    // Create initial credit account
    if (data?.id) {
      await supabase
        ?.from('user_credits')
        ?.insert({
          user_id: data?.id,
          balance: 0
        });
    }

    return data;
  },

  // Enhanced analytics that works with complete user data
  async getAnalytics() {
    const users = await this.fetchAllUsers();
    
    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(u => u?.is_active)?.length || 0;
    
    // Update to use tier instead of plan
    const trialUsers = users?.filter(u => 
      u?.user_subscriptions?.some(s => s?.tier === 'registered' && s?.status === 'trial')
    )?.length || 0;
    const subscriberUsers = users?.filter(u => 
      u?.user_subscriptions?.some(s => s?.tier === 'subscriber')
    )?.length || 0;
    const founderUsers = users?.filter(u => 
      u?.user_subscriptions?.some(s => s?.tier === 'founder')
    )?.length || 0;
    const unlimitedUsers = users?.filter(u => 
      u?.user_subscriptions?.some(s => s?.tier === 'unlimited')
    )?.length || 0;
    
    // Admin users count
    const adminUsers = users?.filter(u => u?.role === 'admin')?.length || 0;
    
    // Legacy premium count for backward compatibility
    const premiumUsers = users?.filter(u => 
      u?.user_subscriptions?.some(s => ['subscriber', 'founder', 'unlimited']?.includes(s?.tier))
    )?.length || 0;
    
    const totalCredits = users?.reduce((sum, u) => 
      sum + (u?.user_credits?.[0]?.balance || 0), 0
    ) || 0;

    return {
      totalUsers,
      activeUsers,
      trialUsers,
      premiumUsers, // Keep for backward compatibility
      subscriberUsers,
      founderUsers, 
      unlimitedUsers,
      adminUsers, // New metric
      totalCredits,
      avgCreditsPerUser: totalUsers > 0 ? Math.round(totalCredits / totalUsers) : 0
    };
  },

  // New function to manually sync users (for admin use)
  async syncMissingUsers() {
    const { data, error } = await supabase?.rpc('sync_missing_user_profiles');
    if (error) throw error;
    return data;
  },

  // New function to sync user credits (for admin use)
  async syncMissingUserCredits() {
    const { data, error } = await supabase?.rpc('sync_missing_user_credits');
    if (error) throw error;
    return data;
  },

  // New function to sync user subscriptions (for admin use) 
  async syncMissingUserSubscriptions() {
    const { data, error } = await supabase?.rpc('sync_missing_user_subscriptions');
    if (error) throw error;
    return data;
  }
};