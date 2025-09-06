import React, { useState, useEffect } from 'react';
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
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason(''); // Reset reason when modal opens
      setProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!reason?.trim()) {
      return; // Don't proceed without a reason
    }
    
    setProcessing(true);
    
    try {
      await onConfirm(reason?.trim());
    } catch (error) {
      console.error('Error processing status change:', error);
      // Don't close modal on error, let user retry
      setProcessing(false);
      return;
    }
    
    setProcessing(false);
    onClose(); // Close modal only on success
  };

  const handleCancel = () => {
    setReason('');
    setProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  const isActivating = action === 'activate';
  const title = isActivating ? 'Activate Assistant' : 'Deactivate Assistant';
  const actionText = isActivating ? 'Activate' : 'Deactivate';
  const statusText = isActivating ? 'active' : 'inactive';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isActivating ? 'bg-green-500' : 'bg-orange-500'
            }`}>
              <Icon name={isActivating ? "Play" : "Pause"} size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={processing}
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            You are about to {actionText?.toLowerCase()} "{assistant?.name}".
            {isActivating 
              ? ' This will make the assistant available for conversations.'
              : ' This will hide the assistant from users and disable conversations.'
            }
          </p>
          
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Icon name="Bot" size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{assistant?.name}</h3>
                <p className="text-sm text-muted-foreground">{assistant?.knowledge_bank}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Status will change to: <span className={`font-medium ${
                isActivating ? 'text-green-600' : 'text-orange-600'
              }`}>
                {statusText}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason for {actionText?.toLowerCase()} <span className="text-error">*</span>
            </label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e?.target?.value)}
              placeholder={`Why are you ${actionText?.toLowerCase()}ing this assistant?`}
              disabled={processing}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              This reason will be logged for audit purposes
            </p>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isActivating ? "default" : "destructive"}
            onClick={handleSubmit}
            iconName={processing ? "Loader2" : (isActivating ? "Play" : "Pause")}
            iconPosition="left"
            disabled={processing || !reason?.trim()}
            className={processing ? "animate-spin" : ""}
          >
            {processing 
              ? `${actionText}ing...`
              : `${actionText} Assistant`
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssistantStatusModal;