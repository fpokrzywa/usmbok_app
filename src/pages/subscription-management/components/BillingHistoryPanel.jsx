import React from 'react';
import { Calendar, CreditCard, User, TrendingUp, ArrowRight } from 'lucide-react';

const BillingHistoryPanel = ({ planChanges, billingSimulations }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'founder':
        return 'text-purple-600';
      case 'unlimited':
        return 'text-green-600';
      case 'subscriber':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Plan Changes History */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Plan Changes</h3>
        </div>
        
        {(!planChanges || planChanges?.length === 0) ? (
          <p className="text-gray-500 text-sm">No plan changes yet</p>
        ) : (
          <div className="space-y-4">
            {planChanges?.map((change) => (
              <div key={change?.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {change?.from_tier && (
                      <span className={`text-sm ${getTierColor(change?.from_tier)}`}>
                        {change?.from_plan?.name || change?.from_tier}
                      </span>
                    )}
                    {change?.from_tier && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${getTierColor(change?.to_tier)}`}>
                      {change?.to_plan?.name || change?.to_tier}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(change?.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {change?.change_reason || 'Plan upgraded'}
                </p>
                {change?.processed_by_user?.full_name && (
                  <div className="flex items-center mt-2">
                    <User className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">
                      Processed by: {change?.processed_by_user?.full_name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing Simulations */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Billing Activity</h3>
        </div>
        
        {(!billingSimulations || billingSimulations?.length === 0) ? (
          <p className="text-gray-500 text-sm">No billing activity yet</p>
        ) : (
          <div className="space-y-4">
            {billingSimulations?.map((simulation) => (
              <div key={simulation?.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getTierColor(simulation?.tier)}`}>
                      {simulation?.tier?.charAt(0)?.toUpperCase() + simulation?.tier?.slice(1)} Plan
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(simulation?.payment_status)}`}>
                      {simulation?.payment_status}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${simulation?.simulated_price}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(simulation?.created_at)}</span>
                  </div>
                  <span className="capitalize">{simulation?.payment_method}</span>
                </div>
                {simulation?.processed_at && (
                  <div className="mt-2 text-xs text-gray-500">
                    Processed: {formatDate(simulation?.processed_at)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingHistoryPanel;