import React from 'react';
import { Warehouse, BarChart3, Users } from 'lucide-react';
import { useWarehouseStats } from '../../hooks/useWarehouses';

export const WarehouseStats: React.FC = () => {
  const { data: stats, isLoading } = useWarehouseStats();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      name: 'Total Warehouses',
      value: stats.total,
      icon: Warehouse,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Total Capacity',
      value: stats.total_capacity.toLocaleString() + ' cylinders',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Average Capacity',
      value: stats.average_capacity.toLocaleString() + ' cylinders',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statItems.map((item) => (
          <div key={item.name} className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${item.bgColor} mb-2`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <div className="text-lg font-bold text-gray-900">{item.value}</div>
            <div className="text-sm text-gray-600">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};