import {
  Category,
  Product,
  Sale,
  AuthResponse,
  DashboardStats,
  SaleRequest,
} from '../types';

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8080';

const TOKEN_KEY = 'pos_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Backend returns i18n error codes; map the common ones to readable messages.
const ERROR_MESSAGES: Record<string, string> = {
  'api.gopgserver.err.001': 'Authentication required.',
  'api.gopgserver.err.004': 'Your session is invalid. Please log in again.',
  'api.gopgserver.err.005': 'Invalid data submitted.',
  'api.gopgserver.err.007': 'Email or username is required.',
  'api.gopgserver.err.008': 'Password is required.',
  'api.gopgserver.err.015': 'Email is required.',
  'api.gopgserver.err.017': 'Password must be at least 6 characters.',
  'api.gopgserver.err.018': 'Invalid credentials.',
  'api.gopgserver.err.051': 'You do not have permission to perform this action.',
  'api.gopgserver.err.056': 'Your session has expired. Please log in again.',
  'api.gopgserver.err.076': 'Please enter a valid email address.',
  'api.gopgserver.err.113': 'An account with this email already exists.',
};

function translateError(code: string): string {
  return ERROR_MESSAGES[code] || code || 'Something went wrong.';
}

interface Envelope<T> {
  result: T;
  error: string;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = tokenStore.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: Envelope<T> | null = null;
  try {
    payload = (await res.json()) as Envelope<T>;
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok || (payload && payload.error)) {
    const code = payload?.error || `HTTP ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      // token no longer valid — drop it so the app returns to login
      if (code === 'api.gopgserver.err.004' || code === 'api.gopgserver.err.056') {
        tokenStore.clear();
      }
    }
    throw new Error(translateError(code));
  }

  return (payload as Envelope<T>).result;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/pos/login', { email, password }),
  register: (email: string, password: string, name?: string) =>
    request<AuthResponse>('POST', '/pos/register', { email, password, name }),
  me: () => request<AuthResponse>('GET', '/pos/me'),
  logout: () => request<boolean>('PUT', '/pos/logout'),

  // Categories
  getCategories: () => request<Category[]>('GET', '/categories'),
  createCategory: (data: { name: string; name_bn: string }) =>
    request<Category>('POST', '/categories', data),
  updateCategory: (id: string, data: { name: string; name_bn: string }) =>
    request<Category>('PUT', `/categories/${id}`, data),
  deleteCategory: (id: string) =>
    request<boolean>('DELETE', `/categories/${id}`),

  // Products
  getProducts: (inStock = false) =>
    request<Product[]>('GET', `/products${inStock ? '?in_stock=true' : ''}`),
  getProduct: (id: string) => request<Product>('GET', `/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('POST', '/products', data),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>('PUT', `/products/${id}`, data),
  deleteProduct: (id: string) => request<boolean>('DELETE', `/products/${id}`),

  // Sales
  createSale: (data: SaleRequest) => request<Sale>('POST', '/sales', data),
  getSales: (date: string) => request<Sale[]>('GET', `/sales?date=${date}`),
  getSale: (id: string) => request<Sale>('GET', `/sales/${id}`),

  // Dashboard
  getDashboard: () => request<DashboardStats>('GET', '/dashboard/stats'),
};
