import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Address, CreateAddressData, UpdateAddressData } from '../types/address';
import toast from 'react-hot-toast';

export const useAddresses = (customerId: string) => {
  return useQuery({
    queryKey: ['addresses', customerId],
    queryFn: async () => {
      if (!customerId || customerId === 'null' || customerId === 'undefined') {
        return [];
      }

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Address[];
    },
    enabled: !!customerId && customerId !== 'null' && customerId !== 'undefined',
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData: CreateAddressData) => {
      if (!addressData.customer_id || addressData.customer_id === 'null' || addressData.customer_id === 'undefined') {
        throw new Error('Invalid customer ID');
      }

      // If setting as primary, first unset other primary addresses for this customer
      if (addressData.is_primary) {
        await supabase
          .from('addresses')
          .update({ is_primary: false })
          .eq('customer_id', addressData.customer_id)
          .eq('is_primary', true);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([addressData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Address;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Address added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add address');
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateAddressData) => {
      if (!id || id === 'null' || id === 'undefined') {
        throw new Error('Invalid address ID');
      }

      // If setting as primary, first unset other primary addresses for this customer
      if (updateData.is_primary && updateData.customer_id) {
        await supabase
          .from('addresses')
          .update({ is_primary: false })
          .eq('customer_id', updateData.customer_id)
          .eq('is_primary', true)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Address;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Address updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update address');
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Address) => {
      if (!address.id || address.id === 'null' || address.id === 'undefined') {
        throw new Error('Invalid address ID');
      }

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', address.id);

      if (error) {
        throw new Error(error.message);
      }

      return address;
    },
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', address.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Address deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });
};

export const useSetPrimaryAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Address) => {
      if (!address.id || address.id === 'null' || address.id === 'undefined') {
        throw new Error('Invalid address ID');
      }

      if (!address.customer_id || address.customer_id === 'null' || address.customer_id === 'undefined') {
        throw new Error('Invalid customer ID');
      }

      // First unset all primary addresses for this customer
      await supabase
        .from('addresses')
        .update({ is_primary: false })
        .eq('customer_id', address.customer_id)
        .eq('is_primary', true);

      // Then set this address as primary
      const { data, error } = await supabase
        .from('addresses')
        .update({ is_primary: true })
        .eq('id', address.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Address;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Primary address updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set primary address');
    },
  });
};