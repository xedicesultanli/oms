import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { InventoryBalance, CreateInventoryBalanceData, UpdateInventoryBalanceData, InventoryFilters, InventoryStats, StockAdjustmentData, StockTransferData, StockMovement } from '../types/inventory';
import toast from 'react-hot-toast';

const INVENTORY_PER_PAGE = 50;

export const useInventory = (filters: InventoryFilters = {}) => {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: async () => {
      console.log('Fetching inventory with filters:', filters);
      
      let query = supabase
        .from('inventory_balance')
        .select(`
          *,
          warehouse:warehouses!inventory_balance_warehouse_id_fkey(id, name),
          product:products!inventory_balance_product_id_fkey(id, sku, name, unit_of_measure)
        `, { count: 'exact' })
        .order('updated_at', { ascending: false });

      // Apply warehouse filter
      if (filters.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`product.sku.ilike.%${filters.search}%,product.name.ilike.%${filters.search}%`);
      }

      // Apply low stock filter
      if (filters.low_stock_only) {
        // This would need a computed column or view in production
        // For now, we'll filter client-side
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || INVENTORY_PER_PAGE;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);

      const { data, error, count } = await query;

      console.log('Supabase inventory response:', { data, error, count });

      if (error) {
        console.error('Supabase inventory error:', error);
        throw new Error(error.message);
      }

      let inventory = (data || []) as InventoryBalance[];

      // Client-side low stock filtering if needed
      if (filters.low_stock_only) {
        inventory = inventory.filter(item => (item.qty_full - item.qty_reserved) <= 10);
      }

      return {
        inventory,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      };
    },
    retry: 1,
    staleTime: 30000,
  });
};

export const useInventoryStats = () => {
  return useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      console.log('Fetching inventory statistics');
      
      const { data, error } = await supabase
        .from('inventory_balance')
        .select('qty_full, qty_empty, qty_reserved');

      if (error) {
        console.error('Inventory stats error:', error);
        throw new Error(error.message);
      }

      const stats: InventoryStats = {
        total_cylinders: data.reduce((sum, item) => sum + item.qty_full + item.qty_empty, 0),
        total_full: data.reduce((sum, item) => sum + item.qty_full, 0),
        total_empty: data.reduce((sum, item) => sum + item.qty_empty, 0),
        total_reserved: data.reduce((sum, item) => sum + item.qty_reserved, 0),
        total_available: data.reduce((sum, item) => sum + (item.qty_full - item.qty_reserved), 0),
        low_stock_products: data.filter(item => (item.qty_full - item.qty_reserved) <= 10).length,
      };

      console.log('Inventory stats:', stats);
      return stats;
    },
    staleTime: 60000,
  });
};

export const useWarehouseInventory = (warehouseId: string) => {
  return useQuery({
    queryKey: ['warehouse-inventory', warehouseId],
    queryFn: async () => {
      console.log('Fetching warehouse inventory:', warehouseId);
      
      if (!warehouseId || warehouseId === 'null' || warehouseId === 'undefined') {
        return [];
      }
      
      const { data, error } = await supabase
        .from('inventory_balance')
        .select(`
          *,
          product:products!inventory_balance_product_id_fkey(id, sku, name, unit_of_measure)
        `)
        .eq('warehouse_id', warehouseId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Warehouse inventory error:', error);
        throw new Error(error.message);
      }

      return (data || []) as InventoryBalance[];
    },
    enabled: !!warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined',
    staleTime: 30000,
  });
};

export const useProductInventory = (productId: string) => {
  return useQuery({
    queryKey: ['product-inventory', productId],
    queryFn: async () => {
      console.log('Fetching product inventory:', productId);
      
      if (!productId || productId === 'null' || productId === 'undefined') {
        return [];
      }
      
      const { data, error } = await supabase
        .from('inventory_balance')
        .select(`
          *,
          warehouse:warehouses!inventory_balance_warehouse_id_fkey(id, name)
        `)
        .eq('product_id', productId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Product inventory error:', error);
        throw new Error(error.message);
      }

      return (data || []) as InventoryBalance[];
    },
    enabled: !!productId && productId !== 'null' && productId !== 'undefined',
    staleTime: 30000,
  });
};

export const useStockMovements = (limit: number = 10) => {
  return useQuery({
    queryKey: ['stock-movements', limit],
    queryFn: async () => {
      console.log('Fetching recent stock movements');
      
      // This would need a stock_movements table in production
      // For now, we'll return empty array as placeholder
      return [] as StockMovement[];
    },
    staleTime: 30000,
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adjustmentData: StockAdjustmentData) => {
      console.log('Adjusting stock:', adjustmentData);
      
      if (!adjustmentData.inventory_id || adjustmentData.inventory_id === 'null' || adjustmentData.inventory_id === 'undefined') {
        throw new Error('Invalid inventory ID');
      }
      
      // Get current inventory record
      const { data: currentInventory, error: fetchError } = await supabase
        .from('inventory_balance')
        .select('*')
        .eq('id', adjustmentData.inventory_id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Calculate new quantities
      const newQtyFull = currentInventory.qty_full + adjustmentData.qty_full_change;
      const newQtyEmpty = currentInventory.qty_empty + adjustmentData.qty_empty_change;

      // Validate quantities
      if (newQtyFull < 0 || newQtyEmpty < 0) {
        throw new Error('Stock quantities cannot be negative');
      }

      // Update inventory
      const { data, error } = await supabase
        .from('inventory_balance')
        .update({
          qty_full: newQtyFull,
          qty_empty: newQtyEmpty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adjustmentData.inventory_id)
        .select(`
          *,
          warehouse:warehouses!inventory_balance_warehouse_id_fkey(id, name),
          product:products!inventory_balance_product_id_fkey(id, sku, name, unit_of_measure)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // TODO: Create stock movement record for audit trail

      return data as InventoryBalance;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory', data.warehouse_id] });
      queryClient.invalidateQueries({ queryKey: ['product-inventory', data.product_id] });
      toast.success('Stock adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to adjust stock');
    },
  });
};

export const useTransferStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transferData: StockTransferData) => {
      console.log('Transferring stock:', transferData);
      
      // Validate IDs
      if (!transferData.from_warehouse_id || transferData.from_warehouse_id === 'null' || transferData.from_warehouse_id === 'undefined') {
        throw new Error('Invalid source warehouse ID');
      }
      
      if (!transferData.to_warehouse_id || transferData.to_warehouse_id === 'null' || transferData.to_warehouse_id === 'undefined') {
        throw new Error('Invalid destination warehouse ID');
      }
      
      if (!transferData.product_id || transferData.product_id === 'null' || transferData.product_id === 'undefined') {
        throw new Error('Invalid product ID');
      }
      
      // Get source inventory
      const { data: sourceInventory, error: sourceError } = await supabase
        .from('inventory_balance')
        .select('*')
        .eq('warehouse_id', transferData.from_warehouse_id)
        .eq('product_id', transferData.product_id)
        .single();

      if (sourceError) {
        throw new Error('Source inventory not found');
      }

      // Validate transfer quantities
      if (transferData.qty_full > sourceInventory.qty_full) {
        throw new Error('Cannot transfer more full cylinders than available');
      }
      if (transferData.qty_empty > sourceInventory.qty_empty) {
        throw new Error('Cannot transfer more empty cylinders than available');
      }

      // Get or create destination inventory
      let { data: destInventory, error: destError } = await supabase
        .from('inventory_balance')
        .select('*')
        .eq('warehouse_id', transferData.to_warehouse_id)
        .eq('product_id', transferData.product_id)
        .single();

      if (destError && destError.code === 'PGRST116') {
        // Create new inventory record for destination
        const { data: newDestInventory, error: createError } = await supabase
          .from('inventory_balance')
          .insert([{
            warehouse_id: transferData.to_warehouse_id,
            product_id: transferData.product_id,
            qty_full: 0,
            qty_empty: 0,
            qty_reserved: 0,
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        destInventory = newDestInventory;
      } else if (destError) {
        throw new Error(destError.message);
      }

      // Perform transfer using transaction
      const { error: transferError } = await supabase.rpc('transfer_stock', {
        p_from_warehouse_id: transferData.from_warehouse_id,
        p_to_warehouse_id: transferData.to_warehouse_id,
        p_product_id: transferData.product_id,
        p_qty_full: transferData.qty_full,
        p_qty_empty: transferData.qty_empty,
      });

      if (transferError) {
        // Fallback to manual transaction if RPC doesn't exist
        // Update source inventory
        await supabase
          .from('inventory_balance')
          .update({
            qty_full: sourceInventory.qty_full - transferData.qty_full,
            qty_empty: sourceInventory.qty_empty - transferData.qty_empty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sourceInventory.id);

        // Update destination inventory
        await supabase
          .from('inventory_balance')
          .update({
            qty_full: destInventory.qty_full + transferData.qty_full,
            qty_empty: destInventory.qty_empty + transferData.qty_empty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', destInventory.id);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['product-inventory'] });
      toast.success('Stock transferred successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to transfer stock');
    },
  });
};

export const useCreateInventoryBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventoryData: CreateInventoryBalanceData) => {
      console.log('Creating inventory balance:', inventoryData);
      
      // Validate IDs
      if (!inventoryData.warehouse_id || inventoryData.warehouse_id === 'null' || inventoryData.warehouse_id === 'undefined') {
        throw new Error('Invalid warehouse ID');
      }
      
      if (!inventoryData.product_id || inventoryData.product_id === 'null' || inventoryData.product_id === 'undefined') {
        throw new Error('Invalid product ID');
      }
      
      const { data, error } = await supabase
        .from('inventory_balance')
        .insert([{
          ...inventoryData,
          updated_at: new Date().toISOString(),
        }])
        .select(`
          *,
          warehouse:warehouses!inventory_balance_warehouse_id_fkey(id, name),
          product:products!inventory_balance_product_id_fkey(id, sku, name, unit_of_measure)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as InventoryBalance;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory', data.warehouse_id] });
      queryClient.invalidateQueries({ queryKey: ['product-inventory', data.product_id] });
      toast.success('Inventory record created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create inventory record');
    },
  });
};