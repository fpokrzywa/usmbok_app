import React from 'react';
import Icon from '../../../components/AppIcon';

const UserAnalytics = ({ analytics }) => {
  const cards = [
    {
      title: 'Total Users',
      value: analytics?.totalUsers || 0,
      icon: 'Users',
      color: 'blue',
      description: 'All registered users'
    },
    {
      title: 'Active Users',
      value: analytics?.activeUsers || 0,
      icon: 'UserCheck',
      color: 'green',
      description: 'Currently active users'
    },
    {
      title: 'Trial Users',
      value: analytics?.trialUsers || 0,
      icon: 'Clock',
      color: 'orange',
      description: 'Users on trial subscription'
    },
    {
      title: 'Subscriber Users',
      value: analytics?.subscriberUsers || 0,
      icon: 'Crown',
      color: 'purple',
      description: 'Active subscribers'
    },
    {
      title: 'Founder Users',
      value: analytics?.founderUsers || 0,
      icon: 'Award',
      color: 'amber',
      description: 'Founder tier users'
    },
    {
      title: 'Unlimited Users',
      value: analytics?.unlimitedUsers || 0,
      icon: 'Zap',
      color: 'indigo',
      description: 'Unlimited plan users'
    },
    {
      title: 'Total Credits',
      value: (analytics?.totalCredits || 0)?.toLocaleString(),
      icon: 'Coins',
      color: 'yellow',
      description: 'Credits across all users'
    },
    {
      title: 'Average Credits',
      value: (analytics?.avgCreditsPerUser || 0)?.toLocaleString(),
      icon: 'TrendingUp',
      color: 'teal',
      description: 'Average credits per user'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards?.map((card, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses?.[card?.color]}`}>
              <Icon name={card?.icon} size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{card?.value}</div>
            <div className="text-sm font-medium text-foreground">{card?.title}</div>
            <div className="text-xs text-muted-foreground">{card?.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserAnalytics;