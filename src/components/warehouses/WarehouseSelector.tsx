import React from 'react';
import { Warehouse, ChevronDown } from 'lucide-react';
import { useWarehouseOptions } from '../../hooks/useWarehouses';

interface WarehouseSelectorProps {
  value?: string;
  onChange: (warehouseId: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const WarehouseSelector: React.FC<WarehouseSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select warehouse...",
  className = "",
  required = false,
}) => {
  const { data: warehouses, isLoading } = useWarehouseOptions();

  const getDisplayText = (warehouseId: string) => {
    const warehouse = warehouses?.find(w => w.id === warehouseId);
    if (!warehouse) return placeholder;
    
    const location = [warehouse.city, warehouse.state].filter(Boolean).join(', ');
    return location ? `${warehouse.name} (${location})` : warehouse.name;
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          <Warehouse className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">Loading warehouses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Warehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
        >
          <option value="">{placeholder}</option>
          {warehouses?.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.city && warehouse.state 
                ? `${warehouse.name} (${warehouse.city}, ${warehouse.state})`
                : warehouse.name
              }
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};