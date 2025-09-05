import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const AssistantStatusModal = ({ 
  assistant, 
  isOpen, 
  onClose, 
  onConfirm,
  action // 'activate' or 'deactivate'
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !assistant) return null;

  const isActivating = action === 'activate';
  
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
      await onConfirm(reason || `Assistant ${action}d by admin`);
    } catch (error) {
      console.error(`Error ${action}ing assistant:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isActivating ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <Icon 
                name={isActivating ? "Play" : "Pause"} 
                size={16} 
                className={isActivating ? "text-green-600" : "text-orange-600"} 
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {isActivating ? 'Activate' : 'Deactivate'} Assistant
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Assistant Info */}
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="Bot" size={16} className="text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">{assistant?.name}</div>
                <div className="text-sm text-muted-foreground">{assistant?.knowledge_bank}</div>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="text-sm text-muted-foreground">
            {isActivating ? (
              <>
                This will <strong>activate</strong> the assistant and make it available for users.
                Users will be able to interact with this assistant and consume tokens.
              </>
            ) : (
              <>
                This will <strong>deactivate</strong> the assistant and make it unavailable for users.
                Existing conversations will remain intact but new interactions will be blocked.
              </>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason (Optional)
            </label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e?.target?.value)}
              placeholder={`Reason for ${action}ing this assistant`}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isActivating ? "default" : "destructive"}
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  {isActivating ? 'Activating...' : 'Deactivating...'}
                </>
              ) : (
                <>
                  <Icon name={isActivating ? "Play" : "Pause"} size={16} className="mr-2" />
                  {isActivating ? 'Activate' : 'Deactivate'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssistantStatusModal;