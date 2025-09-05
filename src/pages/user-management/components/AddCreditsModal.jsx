import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const AddCreditsModal = ({ 
  user, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const creditAmount = parseInt(amount);
    
    if (!creditAmount || creditAmount <= 0) return;

    setLoading(true);
    try {
      await onConfirm({
        amount: creditAmount,
        description: description?.trim() || 'Admin credit adjustment'
      });
      setAmount('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error adding credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="Coins" size={24} className="text-green-600" />
          <h3 className="text-lg font-semibold text-foreground">Add Credits</h3>
        </div>

        <div className="mb-4">
          <p className="text-muted-foreground mb-3">
            Add credits to <strong>{user?.full_name || user?.email}</strong>'s account
          </p>
          <div className="bg-muted/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-medium text-foreground">
                {user?.user_credits?.[0]?.balance?.toLocaleString() || 0} credits
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Credit Amount *
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e?.target?.value)}
              placeholder="Enter credit amount..."
              min="1"
              max="1000000"
              required
              className="w-full"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (optional)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e?.target?.value)}
              placeholder="Enter reason for credit adjustment..."
              className="w-full"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading || !amount || parseInt(amount) <= 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Credits'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCreditsModal;