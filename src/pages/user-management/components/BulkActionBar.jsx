import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const BulkActionBar = ({ selectedCount, onBulkAction }) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [actionData, setActionData] = useState({});

  const actions = [
    { id: 'activate', label: 'Activate Users', icon: 'UserCheck', variant: 'default' },
    { id: 'deactivate', label: 'Deactivate Users', icon: 'UserX', variant: 'outline' },
    { id: 'adjust-credits', label: 'Adjust Credits', icon: 'Coins', variant: 'outline' },
    { id: 'change-subscription', label: 'Change Subscription', icon: 'Crown', variant: 'outline' }
  ];

  const handleActionClick = (actionId) => {
    if (actionId === 'activate' || actionId === 'deactivate') {
      onBulkAction(actionId);
      setShowActionMenu(false);
    } else {
      setActiveAction(actionId);
      setActionData({});
    }
  };

  const handleConfirmAction = () => {
    if (activeAction) {
      onBulkAction(activeAction, actionData);
      setActiveAction(null);
      setActionData({});
      setShowActionMenu(false);
    }
  };

  const renderActionForm = () => {
    switch (activeAction) {
      case 'adjust-credits':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Operation</label>
                <Select
                  value={actionData?.operation || 'add'}
                  onValueChange={(value) => setActionData({ ...actionData, operation: value })}
                  options={[
                    { value: 'add', label: 'Add Credits' },
                    { value: 'deduct', label: 'Deduct Credits' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={actionData?.amount || ''}
                  onChange={(e) => setActionData({ ...actionData, amount: parseInt(e?.target?.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <Input
                  placeholder="Reason for adjustment"
                  value={actionData?.description || ''}
                  onChange={(e) => setActionData({ ...actionData, description: e?.target?.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'change-subscription':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subscription Plan</label>
                <Select
                  value={actionData?.plan || 'trial'}
                  onValueChange={(value) => setActionData({ ...actionData, plan: value })}
                  options={[
                    { value: 'trial', label: 'Trial' },
                    { value: 'subscriber', label: 'Subscriber' },
                    { value: 'founder', label: 'Founder' },
                    { value: 'unlimited', label: 'Unlimited' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Credits per Month</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={actionData?.creditsPerMonth || ''}
                  onChange={(e) => setActionData({ ...actionData, creditsPerMonth: parseInt(e?.target?.value) || 0 })}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon name="CheckSquare" size={20} className="text-primary" />
          <span className="font-medium text-foreground">
            {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {!showActionMenu ? (
            <Button
              onClick={() => setShowActionMenu(true)}
              iconName="Settings"
            >
              Bulk Actions
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              {actions?.map((action) => (
                <Button
                  key={action?.id}
                  variant={action?.variant}
                  size="sm"
                  onClick={() => handleActionClick(action?.id)}
                  iconName={action?.icon}
                >
                  {action?.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowActionMenu(false);
                  setActiveAction(null);
                }}
                iconName="X"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Form */}
      {activeAction && (
        <div className="mt-4 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">
              {actions?.find(a => a?.id === activeAction)?.label} - {selectedCount} users
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveAction(null)}
              iconName="X"
            />
          </div>

          {renderActionForm()}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setActiveAction(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              iconName="Check"
            >
              Apply to {selectedCount} users
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionBar;