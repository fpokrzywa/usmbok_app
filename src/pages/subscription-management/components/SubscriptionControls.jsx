import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import { AlertTriangle, CheckCircle, X, Settings } from 'lucide-react';

const SubscriptionControls = ({ 
  currentSubscription, 
  selectedPlan, 
  onPlanChange, 
  onCancel, 
  onClose, 
  loading 
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!selectedPlan && !showCancelConfirm) {
    return null;
  }

  const handleConfirmChange = () => {
    if (selectedPlan && onPlanChange) {
      onPlanChange(selectedPlan);
    }
  };

  const handleCancelSubscription = () => {
    if (onCancel) {
      onCancel(cancelReason || 'User requested cancellation');
      setShowCancelConfirm(false);
      setCancelReason('');
    }
  };

  // Plan Change Confirmation Modal
  if (selectedPlan && !showCancelConfirm) {
    const isUpgrade = currentSubscription?.tier && 
      ['registered', 'subscriber', 'founder', 'unlimited']?.indexOf(selectedPlan) >
      ['registered', 'subscriber', 'founder', 'unlimited']?.indexOf(currentSubscription?.tier);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isUpgrade ? 'Upgrade Plan' : 'Change Plan'}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              {isUpgrade ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <Settings className="w-5 h-5 text-blue-500 mr-2" />
              )}
              <span className="text-sm text-gray-600">
                You are about to {isUpgrade ? 'upgrade' : 'change'} from{' '}
                <span className="font-medium capitalize">
                  {currentSubscription?.tier || 'current'} plan
                </span>{' '}
                to{' '}
                <span className="font-medium capitalize">
                  {selectedPlan} plan
                </span>
              </span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your plan will be updated immediately</li>
                <li>• Credit allowance will be adjusted</li>
                <li>• Billing cycle will be updated</li>
                {isUpgrade && <li>• You'll gain access to new features</li>}
              </ul>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmChange}
              disabled={loading}
              className={`flex-1 text-white ${
                isUpgrade 
                  ? 'bg-green-600 hover:bg-green-700' :'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : `Confirm ${isUpgrade ? 'Upgrade' : 'Change'}`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Cancel Subscription Confirmation Modal
  if (showCancelConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-900">Cancel Subscription</h3>
            <button 
              onClick={() => setShowCancelConfirm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-gray-600">
                You are about to cancel your subscription
              </span>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-900 mb-2">What happens when you cancel:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• You'll retain access until your next billing date</li>
                <li>• No future charges will occur</li>
                <li>• Your credits will be limited after expiration</li>
                <li>• You can reactivate anytime</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                placeholder="Let us know why you're cancelling..."
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={loading}
            >
              Keep Subscription
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Processing...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionControls;