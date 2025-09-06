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
    domain: assistant?.domain || 'USMXXX', // Changed default to USM code
    knowledge_bank: assistant?.knowledge_bank || '',
    openai_assistant_id: assistant?.openai_assistant_id || '',
    is_active: assistant?.is_active ?? true,
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
    }

    if (!formData?.description?.trim()) {
      newErrors.description = 'Description is required';
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

    if (formData?.credits_per_message < 1 || formData?.credits_per_message > 1000) {
      newErrors.credits_per_message = 'Credits per message must be between 1 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      // Ensure domain is a valid USM code (now text, not enum)
      const validDomain = formData?.domain?.trim()?.toUpperCase() || 'USMXXX';

      // Prepare update data with text domain
      const updateData = {
        name: formData?.name?.trim(),
        description: formData?.description?.trim(),
        domain: validDomain, // Direct text value, no enum casting needed
        knowledge_bank: formData?.knowledge_bank,
        openai_assistant_id: formData?.openai_assistant_id?.trim() || null,
        is_active: formData?.is_active,
        credits_per_message: parseInt(formData?.credits_per_message, 10) || 10
      };

      console.log('Saving assistant data with USM code domain:', updateData);

      await onSave(updateData);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving assistant:', error);
      
      // Check for domain constraint errors
      if (error?.message?.includes('chk_assistants_domain_format') || 
          error?.message?.includes('domain')) {
        setSaveError(`Domain format error: Please use valid USM codes (USMXXX, USM1XX-USM9XX, ITIL, IT4IT)`);
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

  // Get current domain display label
  const getCurrentDomainLabel = () => {
    const currentDomain = domainOptions?.find(option => option?.value === formData?.domain);
    return currentDomain?.label || 'Undefined';
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

        {/* Save Status Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="CheckCircle" size={20} className="text-green-600" />
              <p className="text-green-800 font-medium">
                Assistant {assistant ? 'updated' : 'created'} successfully!
              </p>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="AlertCircle" size={20} className="text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Save failed</p>
                <p className="text-red-700 text-sm mt-1">{saveError}</p>
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
                  placeholder="Enter assistant name"
                  error={errors?.name}
                />
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
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-800">
                        <strong>✅ FIXED:</strong> Domain now accepts USM codes directly!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        The domain column has been converted from enum to text type. 
                        You can now select any USM code (USM1XX-USM9XX, USMXXX) and it will save properly to the database.
                        Changes are saved immediately without enum constraint errors.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Alternative: Manual USM code input */}
                <div className="mt-3">
                  <label className="block text-xs text-muted-foreground mb-1">
                    Or enter custom USM code:
                  </label>
                  <Input
                    type="text"
                    value={formData?.domain}
                    onChange={(e) => handleInputChange('domain', e?.target?.value?.toUpperCase())}
                    placeholder="USM5XX, USM6XX, etc."
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description <span className="text-error">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
                  rows={3}
                  value={formData?.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  placeholder="Describe what this assistant specializes in..."
                />
                {errors?.description && (
                  <p className="mt-1 text-sm text-error">{errors?.description}</p>
                )}
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose the primary knowledge domain for this assistant
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Credits Per Message
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Credits consumed per conversation message
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
                </label>
                <Input
                  type="text"
                  value={formData?.openai_assistant_id}
                  onChange={(e) => handleInputChange('openai_assistant_id', e?.target?.value)}
                  placeholder="asst_xxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The OpenAI Assistant ID for API integration (optional but recommended)
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-md">
                <div className="flex items-start space-x-3">
                  <Icon name="Info" size={16} className="text-primary mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">OpenAI Assistant Configuration</h3>
                    <p className="text-xs text-muted-foreground">
                      To connect this assistant to OpenAI, create an assistant in the OpenAI platform 
                      and copy the Assistant ID here. This enables advanced AI capabilities and 
                      direct integration with OpenAI's API.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Configuration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Status Configuration</h2>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                className="rounded border-border"
                checked={formData?.is_active}
                onChange={(e) => handleInputChange('is_active', e?.target?.checked)}
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                Active Assistant
              </label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Only active assistants are available for conversations. Inactive assistants are hidden from users.
            </p>
          </div>

          {/* Action Buttons */}
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
              disabled={saving}
              className={saving ? "animate-spin" : ""}
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