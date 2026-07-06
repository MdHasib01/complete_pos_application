export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  id_role: number;
}

export interface AuthResponse {
  token?: string;
  user: User;
  role: string;
  permissions: string[];
}

// Backend permission names (see backend/dao/migrations/000002_pos.up.sql)
export const Permissions = {
  ViewProducts: 'VIEW_PRODUCTS',
  ManageProducts: 'MANAGE_PRODUCTS',
  ViewCategories: 'VIEW_CATEGORIES',
  ManageCategories: 'MANAGE_CATEGORIES',
  CreateSale: 'CREATE_SALE',
  ViewSales: 'VIEW_SALES',
  ViewDashboard: 'VIEW_DASHBOARD',
} as const;

export interface Category {
  id: string;
  name: string;
  name_bn: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  name_bn: string;
  barcode: string;
  category_id: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  image_public_id: string | null;
  created_at: string;
  categories?: Category;
}

export interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  payment_method: 'cash' | 'card' | 'mobile';
  user_id: number;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  products?: Product;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleRequest {
  payment_method: string;
  items: { product_id: string; quantity: number; price: number }[];
}

export interface DashboardStats {
  today_sales: number;
  total_products: number;
  low_stock: number;
  total_categories: number;
  recent_sales: Sale[];
}
