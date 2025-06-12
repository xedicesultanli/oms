import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PriceList, PriceListItem, CreatePriceListData, UpdatePriceListData, CreatePriceListItemData, UpdatePriceListItemData, PriceListFilters, PricingStats, BulkPricingData, PriceListStatus } from '../types/pricing';
import toast from 'react-hot-toast';

const PRICE_LISTS_PER_PAGE = 50;

export const usePriceLists = (filters: PriceListFilters = {}) => {
  return useQuery({
    queryKey: ['price-lists', filters],
    queryFn: async () => {
      console.log('Fetching price lists with filters:', filters);
      
      let query = supabase
        .from('price_list')
        .select(`
          *,
          price_list_item(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply currency filter
      if (filters.currency_code) {
        query = query.eq('currency_code', filters.currency_code);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || PRICE_LISTS_PER_PAGE;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);

      const { data, error, count } = await query;

      console.log('Supabase price lists response:', { data, error, count });

      if (error) {
        console.error('Supabase price lists error:', error);
        throw new Error(error.message);
      }

      let priceLists = (data || []) as (PriceList & { price_list_item: { count: number }[] })[];

      // Add product count and filter by status if needed
      const today = new Date().toISOString().split('T')[0];
      const processedLists = priceLists.map(list => ({
        ...list,
        product_count: list.price_list_item?.[0]?.count || 0,
        status: getListStatus(list.start_date, list.end_date, today) as PriceListStatus,
      })).filter(list => {
        if (filters.status) {
          return list.status === filters.status;
        }
        return true;
      });

      return {
        priceLists: processedLists,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      };
    },
    retry: 1,
    staleTime: 30000,
  });
};

export const usePriceList = (id: string) => {
  return useQuery({
    queryKey: ['price-list', id],
    queryFn: async () => {
      console.log('Fetching price list:', id);
      
      const { data, error } = await supabase
        .from('price_list')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Price list fetch result:', { data, error });

      if (error) {
        console.error('Price list fetch error:', error);
        throw new Error(error.message);
      }

      return data as PriceList;
    },
    enabled: !!id,
  });
};

export const fetchPriceListItemsData = async (priceListId: string, search?: string) => {
  console.log('Fetching price list items:', priceListId, search);
  
  let query = supabase
    .from('price_list_item')
    .select(`
      *,
      product:products(id, sku, name, unit_of_measure)
    `)
    .eq('price_list_id', priceListId)
    .order('unit_price', { ascending: false });

  if (search) {
    query = query.or(`product.sku.ilike.%${search}%,product.name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Price list items error:', error);
    throw new Error(error.message);
  }

  return (data || []) as PriceListItem[];
};

export const usePriceListItems = (priceListId: string, search?: string) => {
  return useQuery({
    queryKey: ['price-list-items', priceListId, search],
    queryFn: () => fetchPriceListItemsData(priceListId, search),
    enabled: !!priceListId,
    staleTime: 30000,
  });
};

export const useMultiplePriceListItems = (priceListIds: string[], search?: string) => {
  return useQueries({
    queries: priceListIds.map(priceListId => ({
      queryKey: ['price-list-items', priceListId, search],
      queryFn: () => fetchPriceListItemsData(priceListId, search),
      enabled: !!priceListId,
      staleTime: 30000,
    })),
  });
};

export const usePricingStats = () => {
  return useQuery({
    queryKey: ['pricing-stats'],
    queryFn: async () => {
      console.log('Fetching pricing statistics');
      
      const { data: priceLists, error: priceListsError } = await supabase
        .from('price_list')
        .select('start_date, end_date');

      if (priceListsError) {
        console.error('Pricing stats error:', priceListsError);
        throw new Error(priceListsError.message);
      }

      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const stats: PricingStats = {
        total_price_lists: priceLists.length,
        active_price_lists: priceLists.filter(list => isActiveList(list.start_date, list.end_date, today)).length,
        future_price_lists: priceLists.filter(list => list.start_date > today).length,
        expired_price_lists: priceLists.filter(list => list.end_date && list.end_date < today).length,
        expiring_soon: priceLists.filter(list => list.end_date && list.end_date <= thirtyDaysFromNow && list.end_date >= today).length,
        products_without_pricing: 0, // TODO: Calculate products not in any active price list
      };

      console.log('Pricing stats:', stats);
      return stats;
    },
    staleTime: 60000,
  });
};

export const useCreatePriceList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priceListData: CreatePriceListData) => {
      console.log('Creating price list:', priceListData);
      
      // Check name uniqueness
      const { data: existingName } = await supabase
        .from('price_list')
        .select('id')
        .eq('name', priceListData.name)
        .maybeSingle();

      if (existingName) {
        throw new Error('Price list name already exists. Please use a unique name.');
      }

      // If setting as default, unset other defaults first
      if (priceListData.is_default) {
        await supabase
          .from('price_list')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('price_list')
        .insert([{
          ...priceListData,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      console.log('Create price list result:', { data, error });

      if (error) {
        console.error('Create price list error:', error);
        throw new Error(error.message);
      }

      return data as PriceList;
    },
    onSuccess: (data) => {
      console.log('Price list created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
      toast.success('Price list created successfully');
    },
    onError: (error: Error) => {
      console.error('Create price list mutation error:', error);
      toast.error(error.message || 'Failed to create price list');
    },
  });
};

export const useUpdatePriceList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePriceListData) => {
      console.log('Updating price list:', id, updateData);
      
      // Check name uniqueness if name is being updated
      if (updateData.name) {
        const { data: existingName } = await supabase
          .from('price_list')
          .select('id')
          .eq('name', updateData.name)
          .neq('id', id)
          .maybeSingle();

        if (existingName) {
          throw new Error('Price list name already exists. Please use a unique name.');
        }
      }

      // If setting as default, unset other defaults first
      if (updateData.is_default) {
        await supabase
          .from('price_list')
          .update({ is_default: false })
          .eq('is_default', true)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('price_list')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      console.log('Update price list result:', { data, error });

      if (error) {
        console.error('Update price list error:', error);
        throw new Error(error.message);
      }

      return data as PriceList;
    },
    onSuccess: (data) => {
      console.log('Price list updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['price-list', data.id] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
      toast.success('Price list updated successfully');
    },
    onError: (error: Error) => {
      console.error('Update price list mutation error:', error);
      toast.error(error.message || 'Failed to update price list');
    },
  });
};

export const useDeletePriceList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting price list:', id);
      
      // TODO: Check if price list is referenced in active orders
      
      const { error } = await supabase
        .from('price_list')
        .delete()
        .eq('id', id);

      console.log('Delete price list result:', { error });

      if (error) {
        console.error('Delete price list error:', error);
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: (id) => {
      console.log('Price list deleted successfully:', id);
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
      toast.success('Price list deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Delete price list mutation error:', error);
      toast.error(error.message || 'Failed to delete price list');
    },
  });
};

export const useSetDefaultPriceList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Setting default price list:', id);
      
      // Unset all other defaults first
      await supabase
        .from('price_list')
        .update({ is_default: false })
        .eq('is_default', true);

      // Set this one as default
      const { data, error } = await supabase
        .from('price_list')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PriceList;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['price-list', data.id] });
      toast.success('Default price list updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set default price list');
    },
  });
};

export const useCreatePriceListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: CreatePriceListItemData) => {
      console.log('Creating price list item:', itemData);
      
      const { data, error } = await supabase
        .from('price_list_item')
        .insert([itemData])
        .select(`
          *,
          product:products(id, sku, name, unit_of_measure)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PriceListItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-list-items', data.price_list_id] });
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast.success('Product pricing added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add product pricing');
    },
  });
};

export const useUpdatePriceListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePriceListItemData) => {
      console.log('Updating price list item:', id, updateData);
      
      const { data, error } = await supabase
        .from('price_list_item')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          product:products(id, sku, name, unit_of_measure)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PriceListItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-list-items', data.price_list_id] });
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast.success('Product pricing updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product pricing');
    },
  });
};

export const useDeletePriceListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: PriceListItem) => {
      console.log('Deleting price list item:', item);
      
      const { error } = await supabase
        .from('price_list_item')
        .delete()
        .eq('id', item.id);

      if (error) {
        throw new Error(error.message);
      }

      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['price-list-items', item.price_list_id] });
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast.success('Product removed from price list');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove product from price list');
    },
  });
};

export const useBulkAddProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bulkData: BulkPricingData) => {
      console.log('Bulk adding products:', bulkData);
      
      const items: CreatePriceListItemData[] = [];

      for (const productId of bulkData.product_ids) {
        let unitPrice = bulkData.unit_price || 0;

        if (bulkData.pricing_method === 'copy_from_list' && bulkData.source_price_list_id) {
          // Get price from source list
          const { data: sourceItem } = await supabase
            .from('price_list_item')
            .select('unit_price')
            .eq('price_list_id', bulkData.source_price_list_id)
            .eq('product_id', productId)
            .single();

          if (sourceItem) {
            unitPrice = sourceItem.unit_price;
            if (bulkData.markup_percentage) {
              unitPrice = unitPrice * (1 + bulkData.markup_percentage / 100);
            }
          }
        } else if (bulkData.pricing_method === 'markup' && bulkData.markup_percentage) {
          // Apply markup to base price (would need default price list lookup)
          unitPrice = unitPrice * (1 + bulkData.markup_percentage / 100);
        }

        items.push({
          price_list_id: bulkData.price_list_id,
          product_id: productId,
          unit_price: unitPrice,
          min_qty: bulkData.min_qty,
          surcharge_pct: bulkData.surcharge_pct,
        });
      }

      const { data, error } = await supabase
        .from('price_list_item')
        .insert(items)
        .select(`
          *,
          product:products(id, sku, name, unit_of_measure)
        `);

      if (error) {
        throw new Error(error.message);
      }

      return data as PriceListItem[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['price-list-items', data[0].price_list_id] });
        queryClient.invalidateQueries({ queryKey: ['price-lists'] });
        toast.success(`${data.length} products added to price list`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add products to price list');
    },
  });
};

// Helper functions
const getListStatus = (startDate: string, endDate: string | null, today: string): PriceListStatus => {
  if (startDate > today) return 'future';
  if (endDate && endDate < today) return 'expired';
  return 'active';
};

const isActiveList = (startDate: string, endDate: string | null, today: string): boolean => {
  return startDate <= today && (!endDate || endDate >= today);
};