import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AssistantEditor = ({ 
  assistant, 
  knowledgeBanks, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: assistant?.name || '',
    description: assistant?.description || '',
    domain: assistant?.domain || 'USMXXX',
    knowledge_bank: assistant?.knowledge_bank || '',
    openai_assistant_id: assistant?.openai_assistant_id || '',
    // Fix: Handle state as string values that match database constraint
    state: assistant?.state === 'Active' || assistant?.state === true ? 'Active' : 'Inactive',
    credits_per_message: assistant?.credits_per_message || 10
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Updated domain options with clean USM codes only (no descriptive text)
  const domainOptions = [
    { value: 'USMXXX', label: 'USMXXX' },
    { value: 'USM1XX', label: 'USM1XX' },
    { value: 'USM2XX', label: 'USM2XX' },
    { value: 'USM3XX', label: 'USM3XX' },
    { value: 'USM4XX', label: 'USM4XX' },
    { value: 'USM5XX', label: 'USM5XX' },
    { value: 'USM6XX', label: 'USM6XX' },
    { value: 'USM7XX', label: 'USM7XX' },
    { value: 'USM8XX', label: 'USM8XX' },
    { value: 'USM9XX', label: 'USM9XX' },
    { value: 'ITIL', label: 'ITIL' },
    { value: 'IT4IT', label: 'IT4IT' },
  ];

  const knowledgeBankOptions = knowledgeBanks?.map(bank => ({
    value: bank,
    label: bank
  }));

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData?.name?.trim()?.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData?.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData?.description?.trim()?.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    if (!formData?.domain?.trim()) {
      newErrors.domain = 'Domain is required';
    } else {
      // Validate USM code format
      const usmPattern = /^(USM[X0-9]{3}|ITIL|IT4IT)$/;
      if (!usmPattern?.test(formData?.domain?.trim())) {
        newErrors.domain = 'Invalid USM code format. Use USMXXX, USM1XX-USM9XX, ITIL, or IT4IT';
      }
    }

    if (!formData?.knowledge_bank) {
      newErrors.knowledge_bank = 'Knowledge bank is required';
    }

    if (!formData?.state || !['Active', 'Inactive']?.includes(formData?.state)) {
      newErrors.state = 'Valid state is required (Active or Inactive)';
    }

    if (formData?.credits_per_message < 1 || formData?.credits_per_message > 1000) {
      newErrors.credits_per_message = 'Credits per message must be between 1 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      setSaveError('Please fix the validation errors before saving.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      // Ensure domain is a valid USM code
      const validDomain = formData?.domain?.trim()?.toUpperCase() || 'USMXXX';

      // Prepare update data with string state values that match database constraint
      const updateData = {
        name: formData?.name?.trim(),
        description: formData?.description?.trim(),
        domain: validDomain,
        knowledge_bank: formData?.knowledge_bank,
        openai_assistant_id: formData?.openai_assistant_id?.trim() || null,
        state: formData?.state, // Always 'Active' or 'Inactive'
        credits_per_message: parseInt(formData?.credits_per_message, 10) || 10
      };

      console.log('Saving assistant data:', updateData);

      await onSave(updateData);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving assistant:', error);
      
      // Enhanced error handling for different types of errors
      if (error?.message?.includes('assistants_state_valid') || 
          error?.message?.includes('assistants_state_check') ||
          error?.message?.includes('violates check constraint')) {
        setSaveError('Assistant state validation failed. Please ensure the state is set to Active or Inactive.');
      } else if (error?.message?.includes('unique constraint') || 
                 error?.message?.includes('duplicate key')) {
        setSaveError('An assistant with this name or OpenAI ID already exists. Please use different values.');
      } else if (error?.message?.includes('foreign key constraint')) {
        setSaveError('Knowledge bank assignment failed. Please select a valid knowledge bank.');
      } else if (error?.message?.includes('not null constraint')) {
        setSaveError('Required fields are missing. Please fill in all mandatory information.');
      } else {
        setSaveError(error?.message || 'Failed to save assistant. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear save messages when user makes changes
    if (saveSuccess) setSaveSuccess(false);
    if (saveError) setSaveError('');
  };

  return (
    <main className="pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
              <Icon name={assistant ? "Edit" : "Plus"} size={20} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {assistant ? 'Edit Assistant' : 'Create New Assistant'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Configure AI assistant settings, knowledge bank assignments, and OpenAI integration
          </p>
        </div>

        {/* Enhanced Save Status Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="CheckCircle" size={20} className="text-green-600" />
              <div>
                <p className="text-green-800 font-medium">
                  ✅ Assistant {assistant ? 'updated' : 'created'} successfully!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  All constraint validations passed. The assistant is now {formData?.state === 'Active' ? 'active and available' : 'inactive'} in the system.
                </p>
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="AlertCircle" size={20} className="text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Save Failed</p>
                <p className="text-red-700 text-sm mt-1">{saveError}</p>
                <p className="text-red-600 text-xs mt-2">
                  💡 Check all required fields and ensure unique values for name and OpenAI ID.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Assistant Name <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  value={formData?.name}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                  placeholder="Enter assistant name (min 2 characters)"
                  error={errors?.name}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a unique, descriptive name for this assistant
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  USM Domain Code <span className="text-error">*</span>
                </label>
                <Select
                  options={domainOptions}
                  value={formData?.domain}
                  onChange={(value) => handleInputChange('domain', value)}
                  placeholder="Select USM domain code"
                  error={errors?.domain}
                />
                {errors?.domain && (
                  <p className="mt-1 text-sm text-error">{errors?.domain}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description <span className="text-error">*</span>
                </label>
                <textarea
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical ${
                    errors?.description ? 'border-red-300' : 'border-border'
                  }`}
                  rows={3}
                  value={formData?.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  placeholder="Describe what this assistant specializes in (min 10 characters)..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors?.description && (
                    <p className="text-sm text-error">{errors?.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData?.description?.length || 0}/500 characters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Knowledge Bank Configuration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Knowledge Bank Assignment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Knowledge Bank <span className="text-error">*</span>
                </label>
                <Select
                  options={knowledgeBankOptions}
                  value={formData?.knowledge_bank}
                  onChange={(value) => handleInputChange('knowledge_bank', value)}
                  placeholder="Select knowledge bank"
                  error={errors?.knowledge_bank}
                />
                {errors?.knowledge_bank && (
                  <p className="mt-1 text-sm text-error">{errors?.knowledge_bank}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose the primary knowledge domain for this assistant
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Credits Per Message <span className="text-error">*</span>
                </label>
                <Input
                  type="number"
                  value={formData?.credits_per_message}
                  onChange={(e) => handleInputChange('credits_per_message', parseInt(e?.target?.value) || 0)}
                  placeholder="10"
                  min="1"
                  max="1000"
                  error={errors?.credits_per_message}
                />
                {errors?.credits_per_message && (
                  <p className="mt-1 text-sm text-error">{errors?.credits_per_message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Credits consumed per conversation message (1-1000)
                </p>
              </div>
            </div>
          </div>

          {/* OpenAI Integration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">OpenAI Integration</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  OpenAI Assistant ID
                  <span className="text-muted-foreground text-xs ml-2">(Optional)</span>
                </label>
                <Input
                  type="text"
                  value={formData?.openai_assistant_id}
                  onChange={(e) => handleInputChange('openai_assistant_id', e?.target?.value)}
                  placeholder="asst_xxxxx (leave blank if not using OpenAI)"
                  error={errors?.openai_assistant_id}
                  maxLength={50}
                />
                {errors?.openai_assistant_id && (
                  <p className="mt-1 text-sm text-error">{errors?.openai_assistant_id}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  The OpenAI Assistant ID for API integration. This field is optional - leave blank if not using OpenAI integration or want to configure it later.
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-md">
                <div className="flex items-start space-x-3">
                  <Icon name="Info" size={16} className="text-primary mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Integration Notes</h3>
                    <p className="text-xs text-muted-foreground">
                      <strong>OpenAI Assistant ID:</strong> This field is optional. Leave blank if you are not using OpenAI integration or want to configure it later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Status Configuration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Status Configuration</h2>
            
            <div className="space-y-4">
              {/* State Toggle with validation feedback */}
              <div className="flex items-start space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="state"
                      className="sr-only"
                      checked={formData?.state === 'Active'}
                      onChange={(e) => handleInputChange('state', e?.target?.checked ? 'Active' : 'Inactive')}
                    />
                    <label
                      htmlFor="state"
                      className={`flex items-center cursor-pointer w-14 h-8 rounded-full transition-colors ${
                        formData?.state === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        formData?.state === 'Active' ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </label>
                  </div>
                  <div>
                    <label htmlFor="state" className="text-sm font-medium text-foreground cursor-pointer">
                      {formData?.state === 'Active' ? 'Active Assistant' : 'Inactive Assistant'}
                    </label>
                    <div className={`text-xs ${
                      formData?.state === 'Active' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {formData?.state === 'Active' ?'✓ Available for conversations' :'⚠ Hidden from users'
                      }
                    </div>
                    {errors?.state && (
                      <p className="text-xs text-error mt-1">{errors?.state}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Description with validation success indicator */}
              <div className={`p-4 rounded-lg border-2 ${
                formData?.state === 'Active' ?'bg-green-50 border-green-200' :'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <Icon 
                    name={formData?.state === 'Active' ? "CheckCircle" : "AlertTriangle"} 
                    size={16} 
                    className={formData?.state === 'Active' ? "text-green-600 mt-0.5" : "text-orange-600 mt-0.5"} 
                  />
                  <div>
                    <p className={`text-sm font-medium ${
                      formData?.state === 'Active' ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      Assistant is {formData?.state || 'Unknown State'}
                    </p>
                    <p className={`text-xs mt-1 ${
                      formData?.state === 'Active' ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {formData?.state === 'Active' ?'Users can start conversations and consume credits. Assistant appears in the catalog and domain selection.' :'Assistant is hidden from users. Existing conversations remain intact but no new interactions are allowed.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              iconName={saving ? "Loader2" : "Save"}
              iconPosition="left"
              disabled={saving || Object.keys(errors)?.length > 0}
              className={saving ? "opacity-75" : ""}
            >
              {saving 
                ? (assistant ? 'Updating Assistant...' : 'Creating Assistant...') 
                : (assistant ? 'Update Assistant' : 'Create Assistant')
              }
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AssistantEditor;