import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const CreditAddModal = ({ isOpen, onClose, onConfirm, userId }) => {
  const [amount, setAmount] = useState('100');
  const [description, setDescription] = useState('Admin credit adjustment');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    const creditAmount = parseInt(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(creditAmount, description);
    } catch (error) {
      console.error('Error adding credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('100');
    setDescription('Admin credit adjustment');
    onClose();
  };

  const presetAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="Coins" size={16} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Add Credits</h3>
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Credit Amount
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e?.target?.value)}
              placeholder="Enter credit amount"
              min="1"
              required
            />
          </div>

          {/* Preset Amounts */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {presetAmounts?.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset?.toString())}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    amount === preset?.toString()
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-muted-foreground'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e?.target?.value)}
              placeholder="Reason for credit adjustment"
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Credits to add:</span>
              <span className="font-semibold text-foreground">+{amount}</span>
            </div>
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
              variant="default"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
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

export default CreditAddModal;