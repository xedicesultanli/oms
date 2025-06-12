import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Warehouse, MapPin, Calendar, Package, Activity } from 'lucide-react';
import { useWarehouse, useUpdateWarehouse } from '../hooks/useWarehouses';
import { WarehouseForm } from '../components/warehouses/WarehouseForm';
import { Warehouse as WarehouseType, CreateWarehouseData } from '../types/warehouse';
import { formatAddress } from '../utils/address';

export const WarehouseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const { data: warehouse, isLoading, error } = useWarehouse(id!);
  const updateWarehouse = useUpdateWarehouse();

  const handleEditSubmit = async (data: CreateWarehouseData) => {
    if (warehouse) {
      try {
        await updateWarehouse.mutateAsync({ id: warehouse.id, ...data });
        setIsEditFormOpen(false);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCapacity = (capacity?: number) => {
    if (!capacity) return 'Not specified';
    return capacity.toLocaleString() + ' cylinders';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/warehouses')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Warehouses</span>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/warehouses')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Warehouses</span>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <p className="text-red-600">Warehouse not found or error loading warehouse details.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/warehouses')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Warehouses</span>
          </button>
          <div className="text-gray-400">/</div>
          <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
        </div>
        <button
          onClick={() => setIsEditFormOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Edit Warehouse</span>
        </button>
      </div>

      {/* Warehouse Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Warehouse Name
                </label>
                <div className="flex items-center space-x-2">
                  <Warehouse className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{warehouse.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Storage Capacity
                </label>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formatCapacity(warehouse.capacity_cylinders)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {warehouse.address && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Physical Address
                  </label>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="text-gray-900">
                      <div>{warehouse.address.line1}</div>
                      {warehouse.address.line2 && <div>{warehouse.address.line2}</div>}
                      <div>
                        {warehouse.address.city}
                        {warehouse.address.state && `, ${warehouse.address.state}`}
                        {warehouse.address.postal_code && ` ${warehouse.address.postal_code}`}
                      </div>
                      <div>{warehouse.address.country}</div>
                    </div>
                  </div>
                </div>

                {warehouse.address.instructions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Access Instructions
                    </label>
                    <p className="text-gray-900">{warehouse.address.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Warehouse Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {formatDate(warehouse.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder sections for future features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Inventory</h3>
            <div className="text-center py-4">
              <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Inventory tracking will be available in a future update.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-center py-4">
              <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Activity tracking will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <WarehouseForm
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSubmit={handleEditSubmit}
        warehouse={warehouse}
        loading={updateWarehouse.isPending}
        title="Edit Warehouse"
      />
    </div>
  );
};