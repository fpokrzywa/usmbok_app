import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AssistantStatusModal from './AssistantStatusModal';

const AssistantCard = ({ 
  assistant, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  onStatusChange 
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const getDomainIcon = (domain) => {
    switch (domain) {
      case 'technology': return 'Code';
      case 'business': return 'Briefcase';
      case 'finance': return 'DollarSign';
      case 'marketing': return 'TrendingUp';
      default: return 'Bot';
    }
  };

  const getDomainColor = (domain) => {
    switch (domain) {
      case 'technology': return 'bg-blue-500';
      case 'business': return 'bg-green-500';
      case 'finance': return 'bg-yellow-500';
      case 'marketing': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStatusClick = (action) => {
    setPendingAction(action);
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async (reason) => {
    if (onStatusChange && pendingAction) {
      await onStatusChange(assistant?.id, pendingAction, reason);
    }
    setShowStatusModal(false);
    setPendingAction(null);
  };

  const handleStatusCancel = () => {
    setShowStatusModal(false);
    setPendingAction(null);
  };

  return (
    <>
      <div className={`bg-card border rounded-lg p-6 hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'border-border'
      }`}>
        {/* Header with selection */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={isSelected}
              onChange={onSelect}
            />
            <div className={`w-12 h-12 ${getDomainColor(assistant?.domain)} rounded-full flex items-center justify-center`}>
              <Icon name={getDomainIcon(assistant?.domain)} size={24} className="text-white" />
            </div>
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${
            assistant?.is_active 
              ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          }`}>
            {assistant?.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Assistant Info */}
        <div className="mb-4">
          <h3 className="font-semibold text-foreground mb-1">{assistant?.name}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {assistant?.description}
          </p>
          
          {/* Knowledge Bank */}
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="BookOpen" size={14} className="text-primary" />
            <span className="text-sm font-medium text-primary">
              {assistant?.knowledge_bank}
            </span>
          </div>

          {/* Domain */}
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Tag" size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground capitalize">
              {assistant?.domain}
            </span>
          </div>

          {/* OpenAI Assistant ID */}
          {assistant?.openai_assistant_id && (
            <div className="flex items-center space-x-2">
              <Icon name="Zap" size={14} className="text-accent" />
              <span className="text-xs font-mono text-muted-foreground">
                {assistant?.openai_assistant_id}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/30 rounded-md">
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {assistant?.credits_per_message || 10}
            </div>
            <div className="text-xs text-muted-foreground">Tokens Used</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {Math.floor(Math.random() * 1000) + 100}
            </div>
            <div className="text-xs text-muted-foreground">Total Uses</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              iconName="Edit"
              onClick={onEdit}
              className="flex-1"
            >
              Edit
            </Button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Edit Assistant Settings
            </div>
          </div>

          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              iconName={assistant?.is_active ? "Pause" : "Play"}
              onClick={() => handleStatusClick(assistant?.is_active ? 'deactivate' : 'activate')}
              className={assistant?.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {assistant?.is_active ? 'Deactivate Assistant' : 'Activate Assistant'}
            </div>
          </div>

          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              iconName="Trash2"
              onClick={onDelete}
              className="text-error hover:text-error"
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Delete Assistant
            </div>
          </div>
        </div>
      </div>

      <AssistantStatusModal
        assistant={assistant}
        isOpen={showStatusModal}
        onClose={handleStatusCancel}
        onConfirm={handleStatusConfirm}
        action={pendingAction}
      />
    </>
  );
};

export default AssistantCard;