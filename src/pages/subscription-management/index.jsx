import React, { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { Calendar, User, Settings, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import SubscriptionPlanCard from './components/SubscriptionPlanCard';
import BillingHistoryPanel from './components/BillingHistoryPanel';
import TrialStatusCard from './components/TrialStatusCard';
import SubscriptionControls from './components/SubscriptionControls';
import subscriptionService from '../../services/subscriptionService';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [planChanges, setPlanChanges] = useState([]);
  const [billingSimulations, setBillingSimulations] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionData();
    }
  }, [user?.id]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current subscription details using new service
      const subscription = await subscriptionService?.getCurrentSubscription(user?.id);
      setCurrentSubscription(subscription);

      // Fetch available subscription plans using new service
      const plans = await subscriptionService?.getSubscriptionPlans();
      setSubscriptionPlans(plans || []);

      // Fetch plan change history using new service
      const changes = await subscriptionService?.getSubscriptionHistory(user?.id, 10);
      setPlanChanges(changes || []);

      // Fetch recent billing simulations using new service
      const simulations = await subscriptionService?.getBillingSimulations(user?.id, 5);
      setBillingSimulations(simulations || []);

    } catch (err) {
      setError(err?.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newTier) => {
    try {
      setLoading(true);
      
      await subscriptionService?.changeSubscriptionPlan(user?.id, newTier);
      await fetchSubscriptionData();
      
      setSelectedPlan(null);
      alert('Subscription updated successfully!');
      
    } catch (err) {
      setError(err?.message || 'Failed to change subscription plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      await subscriptionService?.cancelSubscription(user?.id);
      await fetchSubscriptionData();
      
      alert('Subscription cancelled successfully. You will retain access until your next billing date.');
      
    } catch (err) {
      setError(err?.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'trial':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading && !currentSubscription) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your subscription plan, billing, and account tier settings
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => fetchSubscriptionData()}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
              {getStatusIcon(currentSubscription?.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Plan</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {currentSubscription?.tier || 'Registered'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="text-lg font-semibold text-gray-900 capitalize flex items-center">
                  {currentSubscription?.status || 'active'}
                  {currentSubscription?.status === 'trial' && (
                    <span className="ml-2 text-sm text-blue-600">
                      ({currentSubscription?.trial_days_remaining || 0} days left)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Monthly Credits</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentSubscription?.credits_per_month?.toLocaleString() || '100,000'}
                </div>
              </div>
            </div>

            {currentSubscription?.next_billing_date && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Next billing: {new Date(currentSubscription.next_billing_date)?.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      ${currentSubscription?.price_paid || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trial Status for Registered Users */}
        {currentSubscription?.tier === 'registered' && (
          <TrialStatusCard
            trialDaysRemaining={currentSubscription?.trial_days_remaining || 0}
            onUpgrade={() => setSelectedPlan('subscriber')}
          />
        )}

        {/* Subscription Plans */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans?.map((plan) => (
              <SubscriptionPlanCard
                key={plan?.id}
                plan={plan}
                isCurrentPlan={currentSubscription?.tier === plan?.tier}
                onSelect={() => setSelectedPlan(plan?.tier)}
                loading={loading}
              />
            ))}
          </div>
        </div>

        {/* Subscription Controls */}
        <SubscriptionControls
          currentSubscription={currentSubscription}
          selectedPlan={selectedPlan}
          onPlanChange={handlePlanChange}
          onCancel={handleCancelSubscription}
          onClose={() => setSelectedPlan(null)}
          loading={loading}
        />

        {/* Billing History */}
        <BillingHistoryPanel
          planChanges={planChanges}
          billingSimulations={billingSimulations}
        />

        {/* Mobile responsive adjustments */}
        <div className="block md:hidden mt-6">
          <div className="text-center text-sm text-gray-500">
            <p>For the best experience managing your subscription,</p>
            <p>please use a desktop or tablet device.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;