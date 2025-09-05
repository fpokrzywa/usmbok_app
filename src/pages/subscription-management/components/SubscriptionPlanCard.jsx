import React from 'react';
import Button from '../../../components/ui/Button';
import { Check, Crown, Users, Shield } from 'lucide-react';

const SubscriptionPlanCard = ({ plan, isCurrentPlan, onSelect, loading }) => {
  const getPlanIcon = (tier) => {
    switch (tier) {
      case 'registered':
        return <Users className="w-6 h-6 text-gray-500" />;
      case 'subscriber':
        return <Check className="w-6 h-6 text-blue-500" />;
      case 'founder':
        return <Crown className="w-6 h-6 text-purple-500" />;
      case 'admin':
        return <Shield className="w-6 h-6 text-red-500" />;
      default:
        return <Users className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanColor = (tier) => {
    switch (tier) {
      case 'registered':
        return 'border-gray-200';
      case 'subscriber':
        return 'border-blue-200 bg-blue-50';
      case 'founder':
        return 'border-purple-200 bg-purple-50';
      case 'admin':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200';
    }
  };

  const formatCredits = (credits) => {
    if (credits >= 1000000000) return 'Unlimited';
    if (credits >= 1000000) return `${(credits / 1000000)?.toFixed(0)}M`;
    if (credits >= 1000) return `${(credits / 1000)?.toFixed(0)}K`;
    return credits?.toString() || '0';
  };

  const features = plan?.features ? 
    (typeof plan?.features === 'string' ? JSON.parse(plan?.features) : plan?.features) : 
    [];

  return (
    <div className={`relative bg-white border-2 rounded-lg p-6 ${getPlanColor(plan?.tier)} ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}
      <div className="text-center mb-4">
        <div className="flex justify-center mb-2">
          {getPlanIcon(plan?.tier)}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{plan?.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{plan?.description}</p>
      </div>
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-900">
          {plan?.price_usd > 0 ? `$${plan?.price_usd}` : 'Free'}
        </div>
        <div className="text-sm text-gray-500">
          {plan?.billing_cycle === 'unlimited' ? 'Forever' : 'per month'}
        </div>
      </div>
      <div className="mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCredits(plan?.credits_per_month)}
          </div>
          <div className="text-sm text-gray-500">credits/month</div>
        </div>

        {plan?.trial_days > 0 && (
          <div className="mt-2 text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {plan?.trial_days}-day trial
            </span>
          </div>
        )}
      </div>
      <div className="mb-6">
        <ul className="space-y-2">
          {features?.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto">
        {isCurrentPlan ? (
          <Button
            disabled
            className="w-full bg-gray-100 text-gray-500 cursor-not-allowed"
          >
            Current Plan
          </Button>
        ) : plan?.tier === 'admin' ? (
          <Button
            disabled
            className="w-full bg-gray-100 text-gray-500 cursor-not-allowed"
          >
            Admin Only
          </Button>
        ) : (
          <Button
            onClick={() => onSelect?.()}
            disabled={loading}
            className={`w-full ${
              plan?.tier === 'founder' ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : plan?.tier === 'subscriber' ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : plan?.tier === 'unlimited'? 'bg-green-600 hover:bg-green-700 text-white' :'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : 'Select Plan'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;