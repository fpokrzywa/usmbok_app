import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Header from '../../components/ui/Header';
import { supabase } from '../../lib/supabase';

const AssistantCatalog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [assistantCompanions, setAssistantCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Domain to display label mapping - updated to use database domain values dynamically
  const getDomainDisplayInfo = (domainCode, assistantName) => {
    // Domain code to display mapping - updated to match database values
    const domainMappings = {
      'usmbok': { label: 'USMBOK', fullCode: 'USMBOK' },
      'service_infrastructure_management': { label: 'USMXXX', fullCode: 'USMXXX' },
      'service_consumer_management': { label: 'USM1XX', fullCode: 'USM1XX' },
      'service_strategy_management': { label: 'USM2XX', fullCode: 'USM2XX' },
      'service_performance_management': { label: 'USM3XX', fullCode: 'USM3XX' },
      'service_experience_management': { label: 'USM4XX', fullCode: 'USM4XX' },
      'service_delivery_management': { label: 'USM5XX', fullCode: 'USM5XX' },
      'service_operations_management': { label: 'USM6XX', fullCode: 'USM6XX' },
      'service_value_management': { label: 'USM7XX', fullCode: 'USM7XX' },
      'intelligent_automation': { label: 'USM8XX', fullCode: 'USM8XX' },
      'itil': { label: 'ITIL', fullCode: 'ITIL Framework' },
      'it4it': { label: 'IT4IT', fullCode: 'IT4IT Architecture' },
      'business': { label: 'Business', fullCode: 'Business (Legacy)' },
      'technology': { label: 'Technology', fullCode: 'Technology (Legacy)' },
      'finance': { label: 'Finance', fullCode: 'Finance (Legacy)' },
      'marketing': { label: 'Marketing', fullCode: 'Marketing (Legacy)' },
      'undefined': { label: '', fullCode: '' }
    };

    const domainInfo = domainMappings?.[domainCode?.toLowerCase()] || { label: '', fullCode: '' };
    
    // Return the actual domain label from database, not hardcoded mappings
    return {
      subtitle: domainInfo?.label || '',
      displayCode: domainInfo?.fullCode || domainInfo?.label || ''
    };
  };

  // Category mapping based on assistant knowledge bank
  const getCategoryFromKnowledgeBank = (knowledgeBank) => {
    const categoryMappings = {
      'USMBOK': 'Service Management',
      'Service Consumer Management': 'Service Management',
      'Service Strategy Management': 'Strategy & Governance', 
      'Service Performance Management': 'Operations & Delivery',
      'Service Value Management': 'Strategy & Governance',
      'Intelligent Automation': 'Technology & Automation',
      'Service Experience Management': 'Service Management',
      'Service Delivery Management': 'Operations & Delivery',
      'Service Operations Management': 'Operations & Delivery',
      'Service Infrastructure Management': 'Technology & Automation',
      'ITIL': 'Frameworks & Standards',
      'IT4IT': 'Frameworks & Standards'
    };

    return categoryMappings?.[knowledgeBank] || 'Other';
  };

  // Icon mapping based on knowledge bank
  const getIconFromKnowledgeBank = (knowledgeBank) => {
    const iconMappings = {
      'USMBOK': { icon: 'BookOpen', color: 'bg-blue-500' },
      'Service Consumer Management': { icon: 'Users', color: 'bg-green-500' },
      'Service Strategy Management': { icon: 'Target', color: 'bg-purple-500' },
      'Service Performance Management': { icon: 'BarChart3', color: 'bg-indigo-500' },
      'Service Value Management': { icon: 'DollarSign', color: 'bg-yellow-500' },
      'Intelligent Automation': { icon: 'Bot', color: 'bg-red-500' },
      'Service Experience Management': { icon: 'Heart', color: 'bg-pink-500' },
      'Service Delivery Management': { icon: 'Truck', color: 'bg-teal-500' },
      'Service Operations Management': { icon: 'Settings', color: 'bg-gray-500' },
      'Service Infrastructure Management': { icon: 'Server', color: 'bg-cyan-500' },
      'ITIL': { icon: 'Award', color: 'bg-orange-500' },
      'IT4IT': { icon: 'Layers', color: 'bg-violet-500' }
    };

    return iconMappings?.[knowledgeBank] || { icon: 'Bot', color: 'bg-gray-500' };
  };

  // Fetch assistants from Supabase
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase?.from('assistants')?.select('*')?.eq('state', 'Active')?.order('created_at', { ascending: true });

        if (supabaseError) {
          throw supabaseError;
        }

        // Transform Supabase data to match UI expectations - using domain codes as second line
        const transformedAssistants = data?.map((assistant) => {
          const iconInfo = getIconFromKnowledgeBank(assistant?.knowledge_bank);

          return {
            id: assistant?.id,
            name: assistant?.name, // Assistant name as first line
            subtitle: assistant?.domain, // Domain code as second line (USMXXX, USM1XX, etc.)
            description: assistant?.description || '',
            specialty: assistant?.domain, // Keep original domain for filtering
            icon: iconInfo?.icon,
            color: iconInfo?.color,
            expertise: [], // Will be populated from description or other fields if available
            rating: 4.8, // Default rating - could be stored in DB
            conversations: 0, // Could be calculated from actual conversation counts
            credits_per_message: assistant?.credits_per_message || 10,
            knowledge_bank: assistant?.knowledge_bank, // Add knowledge_bank for category mapping
            state: assistant?.state // Add state for future reference
          };
        }) || [];

        setAssistantCompanions(transformedAssistants);
      } catch (err) {
        console.error('Error fetching assistants:', err);
        setError('Failed to load assistants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, []);

  // Filter assistants based on search and filters
  const filteredAssistants = assistantCompanions?.filter((assistant) => {
    const matchesSearch = !searchQuery ||
    assistant?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    assistant?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    assistant?.subtitle?.toLowerCase()?.includes(searchQuery?.toLowerCase());

    const matchesSpecialty = !selectedSpecialty || selectedSpecialty === 'all' ||
    assistant?.specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  // Add category options based on assistants data
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'service-management', label: 'Service Management' },
    { value: 'strategy-governance', label: 'Strategy & Governance' },
    { value: 'operations-delivery', label: 'Operations & Delivery' },
    { value: 'technology-automation', label: 'Technology & Automation' },
    { value: 'frameworks-standards', label: 'Frameworks & Standards' },
    { value: 'other', label: 'Other' }
  ];

  // Add specialty options based on assistants data - updated to match database values
  const specialtyOptions = [
    { value: 'all', label: 'All Specialties' },
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
    { value: 'IT4IT', label: 'IT4IT' }
  ];

  const handleStartConversation = (assistantId) => {
    navigate(`/ai-chat-interface?assistant=${assistantId}`);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh] pt-28">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assistants...</p>
          </div>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh] pt-28">
          <div className="text-center">
            <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Assistants</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location?.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-12 px-4 sm:px-6 lg:px-8 pt-28">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Knowledge Bank</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Choose from our specialized AI Assistants, each trained in specific domains to provide expert guidance and support.</p>

          {/* Search and Filters */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-card rounded-lg shadow-md border border-border">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search companions by name, expertise, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full" />
              </div>
              
              <div className="lg:w-48">
                <Select
                  options={specialtyOptions}
                  value={selectedSpecialty}
                  onChange={setSelectedSpecialty}
                  placeholder="Specialty"
                  className="w-full" />
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Assistants Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Available Companions ({filteredAssistants?.length})
            </h2>
          </div>

          {filteredAssistants?.length === 0 ?
          <div className="text-center py-12">
              <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No companions found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssistants?.map((assistant) =>
            <div key={assistant?.id} className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${assistant?.color} rounded-full flex items-center justify-center mr-4`}>
                      <Icon name={assistant?.icon} size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{assistant?.name}</h3>
                      <p className="text-sm text-muted-foreground">{assistant?.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4">
                    {assistant?.description || `Specialized ${assistant?.name?.toLowerCase()} guidance and support for your service management needs.`}
                  </p>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {getCategoryFromKnowledgeBank(assistant?.knowledge_bank)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Icon name="Star" size={14} className="text-yellow-500 fill-current" />
                      <span>{assistant?.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Icon name="Zap" size={14} />
                      <span>{assistant?.credits_per_message} credits/msg</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                onClick={() => handleStartConversation(assistant?.id)}
                className="w-full">
                    Start Conversation
                  </Button>
                </div>
            )}
            </div>
          }
        </div>
      </section>
    </div>);

};

export default AssistantCatalog;