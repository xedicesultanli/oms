export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit_of_measure: 'cylinder' | 'kg';
  capacity_kg?: number;
  tare_weight_kg?: number;
  valve_type?: string;
  status: 'active' | 'end_of_sale' | 'obsolete';
  barcode_uid?: string;
  created_at: string;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description?: string;
  unit_of_measure: 'cylinder' | 'kg';
  capacity_kg?: number;
  tare_weight_kg?: number;
  valve_type?: string;
  status: 'active' | 'end_of_sale' | 'obsolete';
  barcode_uid?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export interface ProductFilters {
  search?: string;
  status?: string;
  unit_of_measure?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  show_obsolete?: boolean; // New filter to show/hide obsolete products
}

export interface ProductStats {
  total: number;
  active: number;
  end_of_sale: number;
  obsolete: number;
  cylinders: number;
  kg_products: number;
}