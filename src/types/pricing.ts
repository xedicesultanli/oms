export interface PriceList {
  id: string;
  name: string;
  description?: string;
  currency_code: string;
  start_date: string;
  end_date?: string;
  is_default: boolean;
  created_at: string;
  product_count?: number;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  unit_price: number;
  min_qty: number;
  surcharge_pct?: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string;
  };
}

export interface CreatePriceListData {
  name: string;
  description?: string;
  currency_code: string;
  start_date: string;
  end_date?: string;
  is_default: boolean;
}

export interface UpdatePriceListData extends Partial<CreatePriceListData> {
  id: string;
}

export interface CreatePriceListItemData {
  price_list_id: string;
  product_id: string;
  unit_price: number;
  min_qty: number;
  surcharge_pct?: number;
}

export interface UpdatePriceListItemData extends Partial<CreatePriceListItemData> {
  id: string;
}

export interface PriceListFilters {
  search?: string;
  currency_code?: string;
  status?: 'active' | 'future' | 'expired';
  page?: number;
  limit?: number;
}

export interface PricingStats {
  total_price_lists: number;
  active_price_lists: number;
  future_price_lists: number;
  expired_price_lists: number;
  products_without_pricing: number;
  expiring_soon: number;
}

export interface BulkPricingData {
  price_list_id: string;
  product_ids: string[];
  pricing_method: 'fixed' | 'markup' | 'copy_from_list';
  unit_price?: number;
  markup_percentage?: number;
  source_price_list_id?: string;
  min_qty: number;
  surcharge_pct?: number;
}

export type PriceListStatus = 'active' | 'future' | 'expired';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}