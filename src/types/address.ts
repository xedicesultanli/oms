export interface Address {
  id: string;
  customer_id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  delivery_window_start?: string;
  delivery_window_end?: string;
  is_primary: boolean;
  instructions?: string;
  created_at: string;
}

export interface CreateAddressData {
  customer_id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  delivery_window_start?: string;
  delivery_window_end?: string;
  is_primary: boolean;
  instructions?: string;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address?: string;
}