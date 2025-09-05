import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import CreditAddModal from './CreditAddModal';

const UserTable = ({ 
  users = [], 
  selectedUsers = new Set(), 
  onUserSelect, 
  onSelectAll, 
  onViewUser,
  onUserAction 
}) => {
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const itemsPerPage = 10;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedUsers = [...users]?.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'full_name':
        aValue = a?.full_name?.toLowerCase() || '';
        bValue = b?.full_name?.toLowerCase() || '';
        break;
      case 'email':
        aValue = a?.email?.toLowerCase() || '';
        bValue = b?.email?.toLowerCase() || '';
        break;
      case 'created_at':
        aValue = new Date(a?.created_at || 0);
        bValue = new Date(b?.created_at || 0);
        break;
      case 'credits':
        aValue = a?.user_credits?.[0]?.balance || 0;
        bValue = b?.user_credits?.[0]?.balance || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers?.length / itemsPerPage);
  const paginatedUsers = sortedUsers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddCreditsClick = (userId) => {
    setSelectedUserId(userId);
    setShowCreditModal(true);
  };

  const handleCreditAdd = async (amount, description) => {
    if (onUserAction && selectedUserId) {
      await onUserAction('adjust-credits', selectedUserId, { 
        operation: 'add', 
        amount, 
        description 
      });
    }
    setShowCreditModal(false);
    setSelectedUserId(null);
  };

  const getSubscriptionType = (user) => {
    const subscription = user?.user_subscriptions?.[0];
    return subscription?.plan || 'free';
  };

  const getCreditBalance = (user) => {
    return user?.user_credits?.[0]?.balance || 0;
  };

  const getLastActivity = (user) => {
    // Use auth last sign in, credit updates, or profile updates in that order
    const lastSignIn = user?.last_sign_in_at || user?.auth_user?.last_sign_in_at;
    const lastCreditUpdate = user?.user_credits?.[0]?.updated_at;
    const lastProfileUpdate = user?.updated_at;
    
    const dates = [lastSignIn, lastCreditUpdate, lastProfileUpdate]?.filter(Boolean)?.map(d => new Date(d));
    
    if (dates?.length === 0) return 'Never';
    
    const mostRecent = new Date(Math.max(...dates));
    return mostRecent?.toLocaleDateString();
  };

  const getSubscriptionColor = (plan) => {
    switch (plan) {
      case 'trial': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'subscriber': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'founder': 
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'unlimited': 
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'premium': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const SortHeader = ({ column, children }) => (
    <th 
      className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <Icon 
            name="ChevronUp" 
            size={12} 
            className={`${sortBy === column && sortOrder === 'asc' ? 'text-primary' : 'text-muted-foreground'}`}
          />
          <Icon 
            name="ChevronDown" 
            size={12} 
            className={`${sortBy === column && sortOrder === 'desc' ? 'text-primary' : 'text-muted-foreground'}`}
          />
        </div>
      </div>
    </th>
  );

  return (
    <>
      <div className="bg-card border border-border rounded-lg">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 px-4">
                  <input 
                    type="checkbox"
                    className="rounded border-border"
                    checked={selectedUsers?.size > 0 && selectedUsers?.size === users?.length}
                    onChange={(e) => onSelectAll(e?.target?.checked)}
                  />
                </th>
                <SortHeader column="full_name">User</SortHeader>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                <SortHeader column="credits">Credits</SortHeader>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subscription</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <SortHeader column="created_at">Registered</SortHeader>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Activity</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers?.map((user) => (
                <tr key={user?.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4">
                    <input 
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedUsers?.has(user?.id)}
                      onChange={(e) => onUserSelect(user?.id, e?.target?.checked)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user?.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : user?.role === 'premium'? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {user?.role || 'member'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">
                      {getCreditBalance(user)?.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Tokens Used</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSubscriptionColor(getSubscriptionType(user))}`}>
                      {getSubscriptionType(user)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user?.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {user?.created_at ? new Date(user.created_at)?.toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {getLastActivity(user)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <div className="relative group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          iconName="Eye"
                          onClick={() => onViewUser(user?.id)}
                          className="h-8 w-8 p-0"
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          View User Details
                        </div>
                      </div>
                      <div className="relative group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          iconName="Coins"
                          onClick={() => handleAddCreditsClick(user?.id)}
                          className="h-8 w-8 p-0"
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Add Credits
                        </div>
                      </div>
                      <div className="relative group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          iconName={user?.is_active ? "UserX" : "UserCheck"}
                          onClick={() => onUserAction('toggle-status', user?.id)}
                          className="h-8 w-8 p-0"
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {user?.is_active ? 'Deactivate User' : 'Activate User'}
                        </div>
                      </div>
                      <div className="relative group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          iconName="Edit3"
                          onClick={() => onViewUser(user?.id)}
                          className="h-8 w-8 p-0"
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Edit User
                        </div>
                      </div>
                      <div className="relative group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          iconName="Crown"
                          onClick={() => onUserAction('change-role', user?.id, { role: user?.role === 'admin' ? 'member' : 'admin' })}
                          className="h-8 w-8 p-0"
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Toggle Admin Role
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedUsers?.length)} of {sortedUsers?.length} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                iconName="ChevronLeft"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                iconName="ChevronRight"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {users?.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Credit Add Modal */}
      <CreditAddModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={handleCreditAdd}
        userId={selectedUserId}
      />
    </>
  );
};

export default UserTable;