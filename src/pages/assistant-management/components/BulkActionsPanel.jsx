import React from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionsPanel = ({ 
  selectedCount, 
  onActivate, 
  onDeactivate, 
  onClear,
  onBulkStatusChange // Add this prop to handle bulk status changes
}) => {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-md">
      <span className="text-sm font-medium text-primary">
        {selectedCount} selected
      </span>
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          iconName="Play"
          onClick={onActivate}
          className="text-success hover:text-success"
        >
          Activate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconName="Pause"
          onClick={onDeactivate}
          className="text-warning hover:text-warning"
        >
          Deactivate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconName="X"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
        <Select
          options={[
            { value: '', label: 'Status Actions' },
            { value: 'Active', label: 'Activate Selected' },
            { value: 'Inactive', label: 'Deactivate Selected' }
          ]}
          value={''}
          onChange={(value) => {
            if (value && value !== '') {
              onBulkStatusChange(value);
            }
          }}
          className="w-48"
        />
      </div>
    </div>
  );
};

export default BulkActionsPanel;