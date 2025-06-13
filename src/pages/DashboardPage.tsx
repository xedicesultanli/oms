import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Users, Package, ShoppingCart, TrendingUp, Warehouse, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { useDashboardStats, useRecentActivity } from '../hooks/useDashboardStats';

export const DashboardPage: React.FC = () => {
  const { adminUser } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const dashboardStats = [
    {
      name: 'Active Customers',
      value: statsLoading ? '...' : (stats?.activeCustomers || 0).toLocaleString(),
      total: statsLoading ? '...' : (stats?.totalCustomers || 0).toLocaleString(),
      change: statsLoading ? '...' : `${stats?.totalCustomers || 0} total`,
      changeType: 'neutral',
      icon: Users,
    },
    {
      name: 'Active Products',
      value: statsLoading ? '...' : (stats?.activeProducts || 0).toLocaleString(),
      total: statsLoading ? '...' : (stats?.totalProducts || 0).toLocaleString(),
      change: statsLoading ? '...' : `${stats?.totalProducts || 0} total`,
      changeType: 'neutral',
      icon: Package,
    },
    {
      name: 'Total Cylinders',
      value: statsLoading ? '...' : (stats?.totalCylinders || 0).toLocaleString(),
      change: statsLoading ? '...' : 'across all warehouses',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      name: 'Warehouses',
      value: statsLoading ? '...' : (stats?.totalWarehouses || 0).toLocaleString(),
      change: statsLoading ? '...' : 'storage locations',
      changeType: 'neutral',
      icon: Warehouse,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {adminUser?.name}!</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetchStats()}
            disabled={statsLoading}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {!statsLoading && stats && stats.lowStockProducts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Low Stock Alert</h3>
              <p className="text-sm text-red-700">
                {stats.lowStockProducts} product{stats.lowStockProducts > 1 ? 's have' : ' has'} low stock levels (≤10 available)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        
        {activitiesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${getActivityColor(activity.color)}`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity to display</p>
          </div>
        )}
      </div>
    </div>
  );
};