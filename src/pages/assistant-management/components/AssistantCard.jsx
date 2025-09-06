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
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Create a function to get display domain codes from database values
  const getDomainDisplayCode = (domain) => {
    const domainToCodeMapping = {
      'usmbok': 'USMBOK',
      'service_infrastructure_management': 'USMXXX',
      'service_consumer_management': 'USM1XX',
      'service_strategy_management': 'USM2XX',
      'service_performance_management': 'USM3XX',
      'service_experience_management': 'USM4XX',
      'service_delivery_management': 'USM5XX',
      'service_operations_management': 'USM6XX',
      'service_value_management': 'USM7XX',
      'intelligent_automation': 'USM8XX',
      'itil': 'ITIL',
      'it4it': 'IT4IT',
      'business': 'Business',
      'technology': 'Technology',
      'finance': 'Finance',
      'marketing': 'Marketing',
      'undefined': 'Undefined'
    };

    return domainToCodeMapping?.[domain?.toLowerCase()] || domain?.toUpperCase() || 'Undefined';
  };

  const getDomainIcon = (domain) => {
    switch (domain?.toLowerCase()) {
      case 'usmbok': case 'service_infrastructure_management': case 'service_consumer_management': case 'service_strategy_management': case 'service_performance_management': case 'service_experience_management': case 'service_delivery_management': case 'service_operations_management': case 'service_value_management': case 'intelligent_automation':
        return 'BookOpen';
      case 'itil': case 'it4it': return 'Award';
      case 'technology': return 'Code';
      case 'business': return 'Briefcase';
      case 'finance': return 'DollarSign';
      case 'marketing': return 'TrendingUp';
      default: return 'Bot';
    }
  };

  const getDomainColor = (domain) => {
    switch (domain?.toLowerCase()) {
      case 'usmbok': return 'bg-indigo-500';
      case 'service_infrastructure_management': return 'bg-indigo-500';
      case 'service_consumer_management': return 'bg-blue-500';
      case 'service_strategy_management': return 'bg-green-500';
      case 'service_performance_management': return 'bg-yellow-500';
      case 'service_experience_management': return 'bg-orange-500';
      case 'service_delivery_management': return 'bg-red-500';
      case 'service_operations_management': return 'bg-purple-500';
      case 'service_value_management': return 'bg-pink-500';
      case 'intelligent_automation': return 'bg-teal-500';
      case 'itil': return 'bg-orange-500';
      case 'it4it': return 'bg-violet-500';
      case 'technology': return 'bg-blue-500';
      case 'business': return 'bg-green-500';
      case 'finance': return 'bg-yellow-500';
      case 'marketing': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Format domain for display - convert to uppercase for USMXXX values
  const formatDomainDisplay = (domain) => {
    if (!domain || domain === 'undefined') return 'Undefined';
    
    const lowerDomain = domain?.toLowerCase();
    if (lowerDomain?.startsWith('usm')) {
      return domain?.toUpperCase();
    }
    
    // For legacy domains, capitalize first letter
    return domain?.charAt(0)?.toUpperCase() + domain?.slice(1);
  };

  const handleStatusToggle = async (e) => {
    e?.stopPropagation();
    setIsUpdating(true);
    
    try {
      // Fix: Pass correct string values to match database constraint
      const currentState = assistant?.state;
      const newAction = currentState === 'Active' ? 'deactivate' : 'activate';
      
      await onStatusChange(assistant?.id, currentState);
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusClick = (action) => {
    setPendingAction(action);
    setShowStatusModal(true);
  };

  const handleStatusCancel = () => {
    setShowStatusModal(false);
    setPendingAction(null);
  };

  const handleStatusConfirm = async () => {
    if (pendingAction && assistant?.id) {
      setIsUpdating(true);
      try {
        await onStatusChange(assistant?.id, pendingAction);
      } catch (error) {
        console.error('Error updating status:', error);
      } finally {
        setIsUpdating(false);
        setShowStatusModal(false);
        setPendingAction(null);
      }
    }
  };

  return (
    <>
      <div className={`bg-card border rounded-lg p-6 hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'border-border'
      } ${isUpdating ? 'opacity-75 pointer-events-none' : ''}`}>
        {/* Header with selection and simple status indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={isSelected}
              onChange={onSelect}
              disabled={isUpdating}
            />
            <div className={`w-12 h-12 ${getDomainColor(assistant?.domain)} rounded-full flex items-center justify-center relative`}>
              <Icon name={getDomainIcon(assistant?.domain)} size={24} className="text-white" />
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Icon name="Loader2" size={16} className="text-white animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          {/* Simple non-clickable status indicator */}
          <div className={`w-3 h-3 rounded-full ${
            assistant?.state === 'Active' ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>

        {/* Assistant Info */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-1">{assistant?.name}</h3>
          
          {/* Domain code as second line subtitle - prominently displayed */}
          <div className="text-sm font-medium text-primary mb-2">
            {getDomainDisplayCode(assistant?.domain)}
          </div>
          
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

        {/* Only Edit button for actions */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            iconName="Edit"
            onClick={onEdit}
            disabled={isUpdating}
          >
            Edit
          </Button>
        </div>

        {/* Loading overlay for status updates */}
        {isUpdating && (
          <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Loader2" size={16} className="animate-spin" />
              <span>Updating status...</span>
            </div>
          </div>
        )}
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