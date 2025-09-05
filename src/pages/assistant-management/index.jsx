import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import AssistantCard from './components/AssistantCard';
import AssistantEditor from './components/AssistantEditor';
import BulkActionsPanel from './components/BulkActionsPanel';
import activityLogService from '../../services/activityLogService';

const AssistantManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [assistants, setAssistants] = useState([]);
  const [filteredAssistants, setFilteredAssistants] = useState([]);
  const [selectedAssistants, setSelectedAssistants] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);

  // Knowledge banks as specified in requirements
  const knowledgeBanks = [
    'USMBOK',
    'Service Consumer Management',
    'Service Strategy Management', 
    'Service Performance Management',
    'Service Value Management',
    'Intelligent Automation',
    'Service Experience Management',
    'Service Delivery Management',
    'Service Operations Management',
    'Service Infrastructure Management',
    'ITIL',
    'IT4IT'
  ];

  const domainOptions = [
    { value: 'all', label: 'All Domains' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'marketing', label: 'Marketing' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user?.id) return;

      try {
        const { data: userProfile, error } = await supabase?.from('user_profiles')?.select('role, email')?.eq('id', user?.id)?.single();

        if (error) throw error;

        const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'ian@ianmclayton.com';
        setHasAdminAccess(isAdmin);

        if (isAdmin) {
          await fetchAssistants();
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setHasAdminAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user?.id]);

  const fetchAssistants = async () => {
    try {
      const { data, error } = await supabase?.from('assistants')?.select('*')?.order('name');

      if (error) throw error;
      setAssistants(data || []);
    } catch (error) {
      console.error('Error fetching assistants:', error);
    }
  };

  // Filter assistants based on search and filters
  useEffect(() => {
    let filtered = assistants;

    if (searchQuery) {
      filtered = filtered?.filter(assistant =>
        assistant?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        assistant?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        assistant?.knowledge_bank?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered?.filter(assistant => 
        statusFilter === 'active' ? assistant?.is_active : !assistant?.is_active
      );
    }

    if (domainFilter !== 'all') {
      filtered = filtered?.filter(assistant => assistant?.domain === domainFilter);
    }

    setFilteredAssistants(filtered);
  }, [assistants, searchQuery, statusFilter, domainFilter]);

  // Real-time subscription for automatic updates
  useEffect(() => {
    if (!hasAdminAccess) return;

    // Set up real-time subscription for assistants table changes
    const assistantsSubscription = supabase
      ?.channel('assistants_changes')
      ?.on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistants'
        },
        (payload) => {
          console.log('Assistant data changed:', payload);
          // Refresh assistant data when any assistant changes
          fetchAssistants();
        }
      )
      ?.subscribe();

    // Set up real-time subscription for knowledge_bank_assistants changes
    const knowledgeBankAssistantsSubscription = supabase
      ?.channel('knowledge_bank_assistants_changes')
      ?.on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_bank_assistants'
        },
        (payload) => {
          console.log('Knowledge bank assistant mapping changed:', payload);
          // Refresh assistant data when knowledge bank mappings change
          fetchAssistants();
        }
      )
      ?.subscribe();

    // Cleanup subscriptions on unmount or when admin access changes
    return () => {
      assistantsSubscription?.unsubscribe();
      knowledgeBankAssistantsSubscription?.unsubscribe();
    };
  }, [hasAdminAccess]);

  const handleAssistantSelect = (assistantId) => {
    const newSelected = new Set(selectedAssistants);
    if (newSelected?.has(assistantId)) {
      newSelected?.delete(assistantId);
    } else {
      newSelected?.add(assistantId);
    }
    setSelectedAssistants(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAssistants?.size === filteredAssistants?.length) {
      setSelectedAssistants(new Set());
    } else {
      setSelectedAssistants(new Set(filteredAssistants?.map(a => a?.id)));
    }
  };

  const handleCreateAssistant = () => {
    setEditingAssistant(null);
    setShowEditor(true);
  };

  const handleEditAssistant = (assistant) => {
    setEditingAssistant(assistant);
    setShowEditor(true);
  };

  const handleSaveAssistant = async (assistantData) => {
    try {
      if (editingAssistant) {
        // Update existing assistant
        const { error } = await supabase?.from('assistants')?.update(assistantData)?.eq('id', editingAssistant?.id);
        if (error) throw error;

        // Log update activity
        await activityLogService?.logActivity({
          activityType: 'assistant_updated',
          entityType: 'assistant',
          entityId: editingAssistant?.id,
          description: `Assistant "${assistantData?.name}" updated`,
          metadata: {
            assistant_name: assistantData?.name,
            knowledge_bank: assistantData?.knowledge_bank,
            changes: assistantData
          }
        });
      } else {
        // Create new assistant
        const { data, error } = await supabase?.from('assistants')?.insert(assistantData)?.select()?.single();
        if (error) throw error;

        // Log creation activity
        await activityLogService?.logActivity({
          activityType: 'assistant_created',
          entityType: 'assistant',
          entityId: data?.id,
          description: `New assistant "${assistantData?.name}" created`,
          metadata: {
            assistant_name: assistantData?.name,
            knowledge_bank: assistantData?.knowledge_bank,
            domain: assistantData?.domain
          }
        });
      }

      await fetchAssistants();
      setShowEditor(false);
      setEditingAssistant(null);
    } catch (error) {
      console.error('Error saving assistant:', error);
    }
  };

  const handleDeleteAssistant = async (assistantId) => {
    if (!confirm('Are you sure you want to delete this assistant?')) return;

    try {
      const { error } = await supabase?.from('assistants')?.delete()?.eq('id', assistantId);

      if (error) throw error;
      await fetchAssistants();
    } catch (error) {
      console.error('Error deleting assistant:', error);
    }
  };

  const handleBulkStatusChange = async (status) => {
    try {
      const { error } = await supabase?.from('assistants')?.update({ is_active: status === 'active' })?.in('id', Array.from(selectedAssistants));

      if (error) throw error;
      await fetchAssistants();
      setSelectedAssistants(new Set());
    } catch (error) {
      console.error('Error updating assistant status:', error);
    }
  };

  const handleAssistantStatusChange = async (assistantId, action, reason) => {
    try {
      const newStatus = action === 'activate';
      
      // Update assistant status
      const { error } = await supabase
        ?.from('assistants')
        ?.update({ is_active: newStatus })
        ?.eq('id', assistantId);

      if (error) throw error;

      // Log admin activity
      const { data: adminProfile } = await supabase
        ?.from('user_profiles')
        ?.select('full_name')
        ?.eq('id', user?.id)
        ?.single();

      const { error: logError } = await supabase
        ?.from('admin_activity_log')
        ?.insert({
          admin_user_id: user?.id,
          entity_type: 'assistant',
          entity_id: assistantId,
          activity_type: newStatus ? 'assistant_activated' : 'assistant_deactivated',
          description: reason || `Assistant ${action}d by ${adminProfile?.full_name || 'admin'}`,
          metadata: {
            action: action,
            reason: reason,
            admin_name: adminProfile?.full_name
          }
        });

      if (logError) console.error('Error logging admin activity:', logError);

      await fetchAssistants();
    } catch (error) {
      console.error(`Error ${action}ing assistant:`, error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Icon name="Loader2" size={48} className="text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading assistant management...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <Icon name="ShieldX" size={48} className="text-error mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
              <p className="text-muted-foreground">You do not have permission to manage assistants.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <AssistantEditor
          assistant={editingAssistant}
          knowledgeBanks={knowledgeBanks}
          onSave={handleSaveAssistant}
          onCancel={() => {
            setShowEditor(false);
            setEditingAssistant(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Assistant Management - KnowledgeChat Pro</title>
        <meta name="description" content="Manage AI assistants, configure knowledge banks, and monitor assistant performance." />
      </Helmet>
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
                <Icon name="Bot" size={20} color="white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Assistant Management</h1>
            </div>
            <p className="text-muted-foreground">
              Create, edit, and manage AI assistants with OpenAI integration and knowledge bank assignments
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Input
                  type="text"
                  placeholder="Search assistants by name, description, or knowledge bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full"
                />
              </div>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status"
              />
              <Select
                options={domainOptions}
                value={domainFilter}
                onChange={setDomainFilter}
                placeholder="Filter by domain"
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={selectedAssistants?.size === filteredAssistants?.length && filteredAssistants?.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({filteredAssistants?.length})
                </span>
              </div>
              {selectedAssistants?.size > 0 && (
                <BulkActionsPanel
                  selectedCount={selectedAssistants?.size}
                  onActivate={() => handleBulkStatusChange('active')}
                  onDeactivate={() => handleBulkStatusChange('inactive')}
                  onClear={() => setSelectedAssistants(new Set())}
                />
              )}
            </div>
            <Button
              variant="default"
              iconName="Plus"
              iconPosition="left"
              onClick={handleCreateAssistant}
            >
              Create Assistant
            </Button>
          </div>

          {/* Assistants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssistants?.map((assistant) => (
              <AssistantCard
                key={assistant?.id}
                assistant={assistant}
                isSelected={selectedAssistants?.has(assistant?.id)}
                onSelect={() => handleAssistantSelect(assistant?.id)}
                onEdit={() => handleEditAssistant(assistant)}
                onDelete={() => handleDeleteAssistant(assistant?.id)}
                onStatusChange={handleAssistantStatusChange}
              />
            ))}
          </div>

          {filteredAssistants?.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Bot" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No assistants found</h3>
              <p className="text-muted-foreground mb-4">
                {assistants?.length === 0 
                  ? "Get started by creating your first AI assistant." :"Try adjusting your search criteria or filters."
                }
              </p>
              {assistants?.length === 0 && (
                <Button
                  variant="default"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={handleCreateAssistant}
                >
                  Create Your First Assistant
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AssistantManagement;