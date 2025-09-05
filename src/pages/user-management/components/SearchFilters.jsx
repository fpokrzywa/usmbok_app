import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SearchFilters = ({ searchTerm, onSearchChange, filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onSearchChange('');
    onFiltersChange({
      subscription: 'all',
      status: 'all',
      creditRange: 'all',
      registrationPeriod: 'all'
    });
  };

  const hasActiveFilters = searchTerm || 
    filters?.subscription !== 'all' || 
    filters?.status !== 'all' || 
    filters?.creditRange !== 'all' || 
    filters?.registrationPeriod !== 'all';

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Search & Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            iconName="X"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e?.target?.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subscription Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Subscription Type
            </label>
            <Select
              value={filters?.subscription}
              onValueChange={(value) => handleFilterChange('subscription', value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'trial', label: 'Trial' },
                { value: 'subscriber', label: 'Subscriber' },
                { value: 'founder', label: 'Founder' },
                { value: 'unlimited', label: 'Unlimited' },
                { value: 'premium', label: 'Premium (Legacy)' },
                { value: 'free', label: 'Free' }
              ]}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Status
            </label>
            <Select
              value={filters?.status}
              onValueChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>

          {/* Credit Range Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Credit Balance
            </label>
            <Select
              value={filters?.creditRange}
              onValueChange={(value) => handleFilterChange('creditRange', value)}
              options={[
                { value: 'all', label: 'All Ranges' },
                { value: 'low', label: 'Low (< 100)' },
                { value: 'medium', label: 'Medium (100-1000)' },
                { value: 'high', label: 'High (> 1000)' }
              ]}
            />
          </div>

          {/* Registration Period Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Registration Period
            </label>
            <Select
              value={filters?.registrationPeriod}
              onValueChange={(value) => handleFilterChange('registrationPeriod', value)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'last-7-days', label: 'Last 7 Days' },
                { value: 'last-30-days', label: 'Last 30 Days' },
                { value: 'last-90-days', label: 'Last 90 Days' }
              ]}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Search: "{searchTerm}"
                <Icon 
                  name="X" 
                  size={12} 
                  className="ml-1 cursor-pointer" 
                  onClick={() => onSearchChange('')}
                />
              </span>
            )}
            {filters?.subscription !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Subscription: {filters?.subscription}
                <Icon 
                  name="X" 
                  size={12} 
                  className="ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('subscription', 'all')}
                />
              </span>
            )}
            {filters?.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Status: {filters?.status}
                <Icon 
                  name="X" 
                  size={12} 
                  className="ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('status', 'all')}
                />
              </span>
            )}
            {filters?.creditRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Credits: {filters?.creditRange}
                <Icon 
                  name="X" 
                  size={12} 
                  className="ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('creditRange', 'all')}
                />
              </span>
            )}
            {filters?.registrationPeriod !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Period: {filters?.registrationPeriod}
                <Icon 
                  name="X" 
                  size={12} 
                  className="ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('registrationPeriod', 'all')}
                />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;