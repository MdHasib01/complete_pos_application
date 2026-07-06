export interface User {
  id: string;
  email: string;
}

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
  created_at: string;
  categories?: Category;
}

export interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  payment_method: 'cash' | 'card' | 'mobile';
  user_id: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
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
