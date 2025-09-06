import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DomainAssistantGrid = ({ domains }) => {
  // Add missing state variables
  const [loading, setLoading] = useState(false);
  const [assistants, setAssistants] = useState([]);
  const [error, setError] = useState(null);
  
  // Add mock supabase object since it's not imported
  const supabase = {
    from: (table) => ({
      select: (fields) => ({
        eq: (field, value) => ({
          order: (field, options) => ({
            // Mock implementation - returns empty data
            then: () => Promise.resolve({ data: [], error: null })
          })
        })
      })
    })
  };

  // Updated to handle the 12 knowledge banks with proper domain mapping
  const getDomainIcon = (domain) => {
    const iconMap = {
      // Knowledge Bank domains
      'USMBOK': 'BookOpen',
      'Service Consumer Management': 'Users',
      'Service Strategy Management': 'Target',
      'Service Performance Management': 'TrendingUp',
      'Service Value Management': 'DollarSign',
      'Intelligent Automation': 'Bot',
      'Service Experience Management': 'Heart',
      'Service Delivery Management': 'Truck',
      'Service Operations Management': 'Settings',
      'Service Infrastructure Management': 'Server',
      'ITIL': 'FileText',
      'IT4IT': 'Network',
      // Legacy domain support
      'Technology': 'Cpu',
      'Healthcare': 'Heart',
      'Finance': 'DollarSign',
      'Legal': 'Scale',
      'Marketing': 'TrendingUp',
      'Education': 'GraduationCap',
      'Research': 'Search',
      'Business': 'Briefcase'
    };
    return iconMap?.[domain] || 'Brain';
  };

  const getDomainColor = (domain) => {
    const colorMap = {
      // Knowledge Bank domain colors
      'USMBOK': 'text-indigo-600 bg-indigo-50',
      'Service Consumer Management': 'text-blue-600 bg-blue-50',
      'Service Strategy Management': 'text-purple-600 bg-purple-50',
      'Service Performance Management': 'text-green-600 bg-green-50',
      'Service Value Management': 'text-yellow-600 bg-yellow-50',
      'Intelligent Automation': 'text-cyan-600 bg-cyan-50',
      'Service Experience Management': 'text-pink-600 bg-pink-50',
      'Service Delivery Management': 'text-orange-600 bg-orange-50',
      'Service Operations Management': 'text-slate-600 bg-slate-50',
      'Service Infrastructure Management': 'text-emerald-600 bg-emerald-50',
      'ITIL': 'text-violet-600 bg-violet-50',
      'IT4IT': 'text-teal-600 bg-teal-50',
      // Legacy domain colors
      'Technology': 'text-blue-600 bg-blue-50',
      'Healthcare': 'text-red-600 bg-red-50',
      'Finance': 'text-green-600 bg-green-50',
      'Legal': 'text-purple-600 bg-purple-50',
      'Marketing': 'text-orange-600 bg-orange-50',
      'Education': 'text-indigo-600 bg-indigo-50',
      'Research': 'text-teal-600 bg-teal-50',
      'Business': 'text-gray-600 bg-gray-50'
    };
    return colorMap?.[domain] || 'text-primary bg-primary/10';
  };

  // Updated function to format domain names with correct subtitles from attachment
  const formatDomainName = (domainId) => {
    const domainNameMap = {
      'usmbok': 'USMBOK®',
      'service_consumer_management': 'Service Consumer Management',
      'service_strategy_management': 'Service Strategy Management',
      'service_performance_management': 'Service Performance Management',
      'service_delivery_management': 'Service Delivery Management',
      'service_operations_management': 'Service Operations Management',
      'service_infrastructure_management': 'Service Infrastructure Management',
      'service_value_management': 'Service Value Management',
      'intelligent_automation': 'Intelligent Automation',
      'service_experience_management': 'Service Experience Management',
      'itil': 'ITIL',
      'it4it': 'IT4IT'
    };
    return domainNameMap?.[domainId] || domainId?.charAt(0)?.toUpperCase() + domainId?.slice(1);
  };

  // Function to get knowledge bank subtitle codes
  const getDomainSubtitle = (domainId) => {
    const subtitleMap = {
      'usmbok': 'Universal Service Management',
      'service_consumer_management': 'USM1XX',
      'service_strategy_management': 'USM2XX',
      'service_performance_management': 'USM3XX',
      'service_delivery_management': 'USM4XX',
      'service_operations_management': 'USM5XX',
      'service_infrastructure_management': 'USM6XX',
      'service_value_management': 'USM7XX',
      'intelligent_automation': 'USM8XX',
      'service_experience_management': 'USM9XX',
      'itil': 'ITIL',
      'it4it': 'IT4IT'
    };
    return subtitleMap?.[domainId] || '';
  };

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          ?.from('assistants')
          ?.select('*')
          ?.eq('state', 'Active') // Updated to use string value
          ?.order('name', { ascending: true });

        if (error) throw error;

        setAssistants(data || []);
      } catch (err) {
        console.error('Error fetching assistants:', err);
        setError('Failed to load assistants');
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div className="text-left">
          <h3 className="text-lg font-semibold text-card-foreground">Knowledge Bank Assistants</h3>
          <p className="text-sm text-muted-foreground">Choose your domain expert consultant</p>
        </div>
        <Link to="/domain-selection">
          <Button variant="ghost" size="sm" iconName="ArrowRight" iconPosition="right">
            View All
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {domains?.map((domain) => {
          const displayName = formatDomainName(domain?.id);
          const subtitle = getDomainSubtitle(domain?.id);
          return (
            <div
              key={domain?.id}
              className="group border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex flex-col items-start text-left space-y-3">
                <div className="flex items-start space-x-3 w-full">
                  <div className={`p-3 rounded-lg ${getDomainColor(displayName)} flex-shrink-0`}>
                    <Icon 
                      name={getDomainIcon(displayName)} 
                      size={24} 
                      className={getDomainColor(displayName)?.split(' ')?.[0]}
                    />
                  </div>
                  
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-medium text-card-foreground group-hover:text-primary transition-colors text-sm">
                      {displayName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {subtitle}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {domain?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Icon name="MessageSquare" size={12} />
                  <span>{domain?.conversationCount || 0} chats</span>
                </div>

                <Link to={`/ai-chat-interface?domain=${domain?.id}`} className="w-full">
                  <Button variant="outline" size="sm" fullWidth>
                    Start Chat
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DomainAssistantGrid;