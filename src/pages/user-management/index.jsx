import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/ui/Header';
import UserTable from './components/UserTable';
import SearchFilters from './components/SearchFilters';
import UserDetailModal from './components/UserDetailModal';
import BulkActionBar from './components/BulkActionBar';
import UserAnalytics from './components/UserAnalytics';
import ExportDialog from './components/ExportDialog';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { userManagementService } from '../../services/userManagementService';
import activityLogService from '../../services/activityLogService';

const UserManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subscription: 'all',
    status: 'all',
    creditRange: 'all',
    registrationPeriod: 'all'
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    trialUsers: 0,
    premiumUsers: 0,
    totalCredits: 0,
    avgCreditsPerUser: 0
  });
  const [successMessage, setSuccessMessage] = useState(null);

  // Check admin access
  useEffect(() => {
    checkAdminAccess();
  }, [user?.id]);

  // Fetch users when access is granted
  useEffect(() => {
    if (hasAdminAccess) {
      fetchUsers();
    }
  }, [hasAdminAccess]);

  // Filter users when search term or filters change
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filters]);

  // Real-time subscription for automatic updates
  useEffect(() => {
    if (!hasAdminAccess) return;

    // Set up real-time subscription for user_profiles changes
    const userProfilesSubscription = supabase
      ?.channel('user_profiles_changes')
      ?.on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        (payload) => {
          console.log('User profile changed:', payload);
          // Refresh user data when any user profile changes
          fetchUsers();
        }
      )
      ?.subscribe();

    // Set up real-time subscription for user_credits changes
    const userCreditsSubscription = supabase
      ?.channel('user_credits_changes')
      ?.on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits'
        },
        (payload) => {
          console.log('User credits changed:', payload);
          // Refresh user data when credits change
          fetchUsers();
        }
      )
      ?.subscribe();

    // Set up real-time subscription for user_subscriptions changes
    const userSubscriptionsSubscription = supabase
      ?.channel('user_subscriptions_changes')
      ?.on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        (payload) => {
          console.log('User subscription changed:', payload);
          // Refresh user data when subscriptions change
          fetchUsers();
        }
      )
      ?.subscribe();

    // Cleanup subscriptions on unmount or when admin access changes
    return () => {
      userProfilesSubscription?.unsubscribe();
      userCreditsSubscription?.unsubscribe();
      userSubscriptionsSubscription?.unsubscribe();
    };
  }, [hasAdminAccess]);

  const checkAdminAccess = async () => {
    if (!user?.id) return;

    try {
      const { data: userProfile, error } = await supabase?.from('user_profiles')?.select('role, email')?.eq('id', user?.id)?.single();

      if (error) throw error;

      const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'ian@ianmclayton.com';
      setHasAdminAccess(isAdmin);
    } catch (error) {
      setError('Failed to verify admin access');
      setHasAdminAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userProfiles = await userManagementService?.fetchAllUsers();
      const analytics = await userManagementService?.getAnalytics();
      
      setUsers(userProfiles);
      setAnalytics(analytics);

    } catch (error) {
      setError('Failed to load users: ' + error?.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered?.filter(user => 
        user?.full_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        user?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase())
      );
    }

    // Subscription filter - updated to use tier instead of plan
    if (filters?.subscription !== 'all') {
      filtered = filtered?.filter(user => 
        user?.user_subscriptions?.some(s => s?.tier === filters?.subscription)
      );
    }

    // Status filter
    if (filters?.status !== 'all') {
      filtered = filtered?.filter(user => 
        filters?.status === 'active' ? user?.is_active : !user?.is_active
      );
    }

    // Credit range filter
    if (filters?.creditRange !== 'all') {
      filtered = filtered?.filter(user => {
        const balance = user?.user_credits?.[0]?.balance || 0;
        switch (filters?.creditRange) {
          case 'low': return balance < 100;
          case 'medium': return balance >= 100 && balance < 1000;
          case 'high': return balance >= 1000;
          default: return true;
        }
      });
    }

    // Registration period filter
    if (filters?.registrationPeriod !== 'all') {
      const now = new Date();
      filtered = filtered?.filter(user => {
        const created = new Date(user?.created_at);
        const daysDiff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        
        switch (filters?.registrationPeriod) {
          case 'last-7-days': return daysDiff <= 7;
          case 'last-30-days': return daysDiff <= 30;
          case 'last-90-days': return daysDiff <= 90;
          default: return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const handleUserSelect = (userId, selected) => {
    const newSelected = new Set(selectedUsers);
    if (selected) {
      newSelected?.add(userId);
    } else {
      newSelected?.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedUsers(new Set(filteredUsers?.map(u => u?.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkAction = async (action, data) => {
    try {
      setError(null);
      const userIds = Array.from(selectedUsers);
      
      switch (action) {
        case 'activate':
          await userManagementService?.bulkUpdateUsers(userIds, { is_active: true });
          setSuccessMessage(`Successfully activated ${userIds?.length} users`);
          break;
        case 'deactivate':
          await userManagementService?.bulkUpdateUsers(userIds, { is_active: false });
          setSuccessMessage(`Successfully deactivated ${userIds?.length} users`);
          break;
        case 'adjust-credits':
          for (const userId of userIds) {
            if (data?.operation === 'add') {
              await userManagementService?.addUserCredits(userId, data?.amount, data?.description || 'Admin bulk adjustment');
            } else {
              await userManagementService?.deductUserCredits(userId, data?.amount, data?.description || 'Admin bulk adjustment');
            }
          }
          setSuccessMessage(`Successfully adjusted credits for ${userIds?.length} users`);
          break;
        case 'change-subscription':
          for (const userId of userIds) {
            await userManagementService?.updateUserSubscription(userId, {
              tier: data?.tier || data?.plan, // Support both tier and plan for compatibility
              is_active: true,
              credits_per_month: data?.creditsPerMonth
            });
          }
          setSuccessMessage(`Successfully updated subscription for ${userIds?.length} users`);
          break;
      }

      setSelectedUsers(new Set());
      await fetchUsers(); // Refresh data
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      setError('Bulk action failed: ' + error?.message);
    }
  };

  const handleUserAction = async (action, userId, data) => {
    try {
      setError(null);
      const targetUser = users?.find(u => u?.id === userId);
      
      switch (action) {
        case 'toggle-status':
          await userManagementService?.toggleUserStatus(userId, !targetUser?.is_active);
          
          // Log the activity with admin user name
          await activityLogService?.logActivity({
            activityType: targetUser?.is_active ? 'user_deactivated' : 'user_activated',
            entityType: 'user',
            entityId: userId,
            userId: userId,
            description: `User ${targetUser?.is_active ? 'deactivated' : 'activated'} by admin`,
            metadata: {
              user_name: targetUser?.full_name || targetUser?.email,
              previous_status: targetUser?.is_active,
              new_status: !targetUser?.is_active,
              admin_name: user?.email
            }
          });
          
          setSuccessMessage(`Successfully ${targetUser?.is_active ? 'deactivated' : 'activated'} user`);
          break;
          
        case 'adjust-credits':
          if (data?.operation === 'add') {
            await userManagementService?.addUserCredits(userId, data?.amount, data?.description || 'Admin adjustment');
          } else {
            await userManagementService?.deductUserCredits(userId, data?.amount, data?.description || 'Admin adjustment');
          }
          
          // Log credit adjustment with admin user name
          await activityLogService?.logActivity({
            activityType: 'credit_adjustment',
            entityType: 'credit',
            entityId: userId,
            userId: userId,
            amount: data?.operation === 'add' ? data?.amount : -data?.amount,
            description: `${data?.operation === 'add' ? 'Added' : 'Deducted'} ${data?.amount} credits ${data?.operation === 'add' ? 'to' : 'from'} user account`,
            metadata: {
              user_name: targetUser?.full_name || targetUser?.email,
              admin_name: user?.email,
              operation: data?.operation,
              reason: data?.description || 'Admin adjustment'
            }
          });
          
          setSuccessMessage('Successfully adjusted user credits');
          break;
          
        case 'change-role':
          await userManagementService?.changeUserRole(userId, data?.role);
          
          // Log role change with admin user name
          await activityLogService?.logActivity({
            activityType: 'user_role_changed',
            entityType: 'user',
            entityId: userId,
            userId: userId,
            description: `User role changed to ${data?.role}`,
            metadata: {
              user_name: targetUser?.full_name || targetUser?.email,
              previous_role: targetUser?.role,
              new_role: data?.role,
              admin_name: user?.email
            }
          });
          
          setSuccessMessage('Successfully updated user role');
          break;
          
        case 'change-subscription':
          await userManagementService?.updateUserSubscription(userId, {
            tier: data?.tier || data?.plan,
            is_active: true,
            credits_per_month: data?.creditsPerMonth
          });
          
          // Log subscription change with admin user name
          await activityLogService?.logActivity({
            activityType: 'user_updated',
            entityType: 'user',
            entityId: userId,
            userId: userId,
            description: `User subscription updated to ${data?.tier || data?.plan}`,
            metadata: {
              user_name: targetUser?.full_name || targetUser?.email,
              subscription_tier: data?.tier || data?.plan,
              admin_name: user?.email
            }
          });
          
          setSuccessMessage('Successfully updated user subscription');
          break;
          
        case 'update-profile':
          await userManagementService?.updateUserProfile(userId, data);
          
          // Log profile update with admin user name
          await activityLogService?.logActivity({
            activityType: 'user_updated',
            entityType: 'user',
            entityId: userId,
            userId: userId,
            description: 'User profile updated by admin',
            metadata: {
              user_name: targetUser?.full_name || targetUser?.email,
              changes: data,
              admin_name: user?.email
            }
          });
          
          setSuccessMessage('Successfully updated user profile');
          break;
          
        case 'delete-user':
          await userManagementService?.deleteUser(userId);
          
          // Log user deletion with admin user name
          await activityLogService?.logActivity({
            activityType: 'user_updated',
            entityType: 'user',
            entityId: userId,
            userId: userId,
            description: 'User account deleted by admin',
            metadata: {
              user_name: targetUser?.full_name || targetUser?.email,
              admin_name: user?.email,
              action: 'deleted'
            }
          });
          
          setSuccessMessage('Successfully deleted user');
          break;
      }

      await fetchUsers(); // Refresh data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError('User action failed: ' + error?.message);
    }
  };

  const handleViewUser = (userId) => {
    const user = users?.find(u => u?.id === userId);
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Icon name="Loader2" size={48} className="text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading user management...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <Icon name="ShieldX" size={48} className="text-error mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
              <p className="text-muted-foreground">You do not have permission to access user management.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>User Management - Admin Dashboard</title>
        <meta name="description" content="Comprehensive user management with advanced search, filtering, and bulk operations." />
      </Helmet>
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Icon name="Users" size={20} color="white" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                </div>
                <p className="text-muted-foreground">
                  Comprehensive administrative control for managing all platform users
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(true)}
                  iconName="Download"
                >
                  Export
                </Button>
                <Button
                  onClick={() => fetchUsers()}
                  iconName="RefreshCw"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={20} className="text-green-600" />
                <p className="text-green-800">{successMessage}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuccessMessage(null)}
                  iconName="X"
                  className="ml-auto"
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-error" />
                <p className="text-error">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  iconName="X"
                  className="ml-auto"
                />
              </div>
            </div>
          )}

          {/* Analytics Panel */}
          <UserAnalytics analytics={analytics} />

          {/* Search and Filters */}
          <SearchFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Bulk Actions Bar */}
          {selectedUsers?.size > 0 && (
            <BulkActionBar
              selectedCount={selectedUsers?.size}
              onBulkAction={handleBulkAction}
            />
          )}

          {/* User Table */}
          <UserTable
            users={filteredUsers}
            selectedUsers={selectedUsers}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAll}
            onViewUser={handleViewUser}
            onUserAction={handleUserAction}
          />

          {/* User Detail Modal */}
          {showUserDetail && selectedUser && (
            <UserDetailModal
              user={selectedUser}
              onClose={() => setShowUserDetail(false)}
              onUserAction={handleUserAction}
            />
          )}

          {/* Export Dialog */}
          {showExportDialog && (
            <ExportDialog
              users={filteredUsers}
              onClose={() => setShowExportDialog(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default UserManagement;