import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Warehouse, MapPin, Calendar, Package, Activity, AlertTriangle, Plus } from 'lucide-react';
import { useWarehouse, useUpdateWarehouse } from '../hooks/useWarehouses';
import { useWarehouseInventory, useAdjustStock, useTransferStock } from '../hooks/useInventory';
import { WarehouseForm } from '../components/warehouses/WarehouseForm';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { StockTransferModal } from '../components/inventory/StockTransferModal';
import { Warehouse as WarehouseType, CreateWarehouseData } from '../types/warehouse';
import { InventoryBalance, StockAdjustmentData, StockTransferData } from '../types/inventory';
import { formatAddress } from '../utils/address';

export const WarehouseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [adjustingInventory, setAdjustingInventory] = useState<InventoryBalance | null>(null);
  const [transferringInventory, setTransferringInventory] = useState<InventoryBalance | null>(null);

  const { data: warehouse, isLoading, error } = useWarehouse(id!);
  const { data: inventory = [], isLoading: inventoryLoading } = useWarehouseInventory(id!);
  const updateWarehouse = useUpdateWarehouse();
  const adjustStock = useAdjustStock();
  const transferStock = useTransferStock();

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

  const handleAdjustStock = (item: InventoryBalance) => {
    setAdjustingInventory(item);
  };

  const handleTransferStock = (item: InventoryBalance) => {
    setTransferringInventory(item);
  };

  const handleAdjustmentSubmit = async (data: StockAdjustmentData) => {
    try {
      await adjustStock.mutateAsync(data);
      setAdjustingInventory(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleTransferSubmit = async (data: StockTransferData) => {
    try {
      await transferStock.mutateAsync(data);
      setTransferringInventory(null);
    } catch (error) {
      // Error handling is done in the hook
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

  const getStockStatusClass = (available: number) => {
    if (available === 0) return 'text-red-600 bg-red-50';
    if (available <= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusIcon = (available: number) => {
    if (available === 0) return <AlertTriangle className="h-4 w-4" />;
    if (available <= 10) return <AlertTriangle className="h-4 w-4" />;
    return null;
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

          {/* Current Inventory */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Current Inventory</h3>
              <button
                onClick={() => navigate('/inventory')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Manage Inventory</span>
              </button>
            </div>

            {inventoryLoading ? (
              <div className="animate-pulse">
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Full
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empty
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reserved
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.map((item) => {
                      const available = item.qty_full - item.qty_reserved;
                      const statusClass = getStockStatusClass(available);
                      const statusIcon = getStockStatusIcon(available);

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.product?.name || 'Unknown Product'}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {item.product?.sku || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-gray-900">
                              {item.qty_full}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-gray-900">
                              {item.qty_empty}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-gray-900">
                              {item.qty_reserved}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${statusClass}`}>
                              {statusIcon}
                              <span>{available}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleAdjustStock(item)}
                                className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                title="Adjust stock"
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => handleTransferStock(item)}
                                className="text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                title="Transfer stock"
                              >
                                Transfer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory found</h3>
                <p className="text-gray-500 mb-4">
                  This warehouse doesn't have any inventory records yet.
                </p>
                <button
                  onClick={() => navigate('/inventory')}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Inventory</span>
                </button>
              </div>
            )}
          </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Total Products
                </label>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {inventory.length} product{inventory.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Total Cylinders
                </label>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {inventory.reduce((sum, item) => sum + item.qty_full + item.qty_empty, 0)} cylinders
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Full Cylinders:</span>
                <span className="text-sm font-medium text-green-600">
                  {inventory.reduce((sum, item) => sum + item.qty_full, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Empty Cylinders:</span>
                <span className="text-sm font-medium text-gray-600">
                  {inventory.reduce((sum, item) => sum + item.qty_empty, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reserved:</span>
                <span className="text-sm font-medium text-orange-600">
                  {inventory.reduce((sum, item) => sum + item.qty_reserved, 0)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-sm font-medium text-gray-900">Available:</span>
                <span className="text-sm font-bold text-blue-600">
                  {inventory.reduce((sum, item) => sum + (item.qty_full - item.qty_reserved), 0)}
                </span>
              </div>
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

      {/* Stock Adjustment Modal */}
      {adjustingInventory && (
        <StockAdjustmentModal
          isOpen={!!adjustingInventory}
          onClose={() => setAdjustingInventory(null)}
          onSubmit={handleAdjustmentSubmit}
          inventory={adjustingInventory}
          loading={adjustStock.isPending}
        />
      )}

      {/* Stock Transfer Modal */}
      {transferringInventory && (
        <StockTransferModal
          isOpen={!!transferringInventory}
          onClose={() => setTransferringInventory(null)}
          onSubmit={handleTransferSubmit}
          inventory={transferringInventory}
          loading={transferStock.isPending}
        />
      )}
    </div>
  );
};