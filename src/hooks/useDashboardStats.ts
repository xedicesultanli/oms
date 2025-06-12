import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  activeProducts: number;
  totalWarehouses: number;
  totalOrders: number;
  totalCylinders: number;
  lowStockProducts: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching dashboard statistics');
      
      // Fetch customers data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('account_status');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      // Fetch products data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('status');

      if (productsError) {
        console.error('Error fetching products:', productsError);
      }

      // Fetch warehouses data
      const { data: warehouses, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id');

      if (warehousesError) {
        console.error('Error fetching warehouses:', warehousesError);
      }

      // Fetch inventory data with explicit foreign key constraints
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_balance')
        .select('qty_full, qty_empty, qty_reserved');

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
      }

      // Calculate statistics
      const stats: DashboardStats = {
        totalCustomers: customers?.length || 0,
        activeCustomers: customers?.filter(c => c.account_status === 'active').length || 0,
        totalProducts: products?.length || 0,
        activeProducts: products?.filter(p => p.status === 'active').length || 0,
        totalWarehouses: warehouses?.length || 0,
        totalOrders: 0, // TODO: Add orders table when implemented
        totalCylinders: inventory?.reduce((sum, item) => sum + item.qty_full + item.qty_empty, 0) || 0,
        lowStockProducts: inventory?.filter(item => (item.qty_full - item.qty_reserved) <= 10).length || 0,
      };

      console.log('Dashboard stats calculated:', stats);
      return stats;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      console.log('Fetching recent activity');
      
      // Fetch recent customers (last 10)
      const { data: recentCustomers, error: customersError } = await supabase
        .from('customers')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (customersError) {
        console.error('Error fetching recent customers:', customersError);
      }

      // Fetch recent products (last 5)
      const { data: recentProducts, error: productsError } = await supabase
        .from('products')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (productsError) {
        console.error('Error fetching recent products:', productsError);
      }

      // Fetch recent inventory updates (last 5) with explicit foreign key constraints
      const { data: recentInventory, error: inventoryError } = await supabase
        .from('inventory_balance')
        .select(`
          updated_at,
          qty_full,
          qty_empty,
          product:products!inventory_balance_product_id_fkey(name, sku),
          warehouse:warehouses!inventory_balance_warehouse_id_fkey(name)
        `)
        .order('updated_at', { ascending: false })
        .limit(3);

      if (inventoryError) {
        console.error('Error fetching recent inventory:', inventoryError);
      }

      // Combine and format activity items
      const activities = [];

      // Add customer registrations
      recentCustomers?.forEach(customer => {
        activities.push({
          id: `customer-${customer.name}`,
          type: 'customer',
          message: `New customer registration: ${customer.name}`,
          timestamp: customer.created_at,
          color: 'blue',
        });
      });

      // Add product additions
      recentProducts?.forEach(product => {
        activities.push({
          id: `product-${product.name}`,
          type: 'product',
          message: `New product added: ${product.name}`,
          timestamp: product.created_at,
          color: 'green',
        });
      });

      // Add inventory updates
      recentInventory?.forEach(item => {
        if (item.product && item.warehouse) {
          activities.push({
            id: `inventory-${item.product.sku}-${item.warehouse.name}`,
            type: 'inventory',
            message: `Stock updated: ${item.product.name} at ${item.warehouse.name}`,
            timestamp: item.updated_at,
            color: 'orange',
          });
        }
      });

      // Sort by timestamp and take the most recent 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      console.log('Recent activities:', sortedActivities);
      return sortedActivities;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};