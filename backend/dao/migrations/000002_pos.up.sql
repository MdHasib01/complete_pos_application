-- POS domain schema: categories, products, sales, sale_items
-- plus POS permissions, role_permission seed and the CASHIER role.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    name_bn text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    name_bn text NOT NULL,
    barcode text UNIQUE NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    price numeric(10, 2) NOT NULL DEFAULT 0,
    stock integer NOT NULL DEFAULT 0,
    image_url text,
    created_at timestamptz DEFAULT now()
);

-- Sales
CREATE TABLE IF NOT EXISTS public.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text UNIQUE NOT NULL DEFAULT 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 100000)::text, 5, '0'),
    total numeric(10, 2) NOT NULL DEFAULT 0,
    payment_method text NOT NULL DEFAULT 'cash',
    user_id integer REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Sale items
CREATE TABLE IF NOT EXISTS public.sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1,
    price numeric(10, 2) NOT NULL,
    subtotal numeric(10, 2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);

-- Default categories
INSERT INTO public.categories (name, name_bn) VALUES
    ('Groceries', 'মুদিখানা'),
    ('Dairy', 'দুগ্ধ'),
    ('Beverages', 'পানীয়'),
    ('Snacks', 'জলখাবার'),
    ('Household', 'গৃহস্থালী'),
    ('Personal Care', 'ব্যক্তিগত যত্ন'),
    ('Electronics', 'ইলেকট্রনিক্স')
ON CONFLICT DO NOTHING;

-- CASHIER role (SUPERADMIN/ADMIN/MANAGER/USERROLE seeded in 000001)
INSERT INTO public.Role (id, name, description, isdeleted) VALUES
    (5, 'CASHIER', 'Point of sale cashier', false)
ON CONFLICT (id) DO NOTHING;
SELECT setval('public.role_id_seq', (SELECT MAX(id) FROM public.Role));

-- POS permissions (ids 20-26)
INSERT INTO public.permission (id, name, description) VALUES
    (20, 'VIEW_PRODUCTS',    'View products'),
    (21, 'MANAGE_PRODUCTS',  'Create, update and delete products'),
    (22, 'VIEW_CATEGORIES',  'View categories'),
    (23, 'MANAGE_CATEGORIES','Create, update and delete categories'),
    (24, 'CREATE_SALE',      'Create a sale / checkout'),
    (25, 'VIEW_SALES',       'View sales history'),
    (26, 'VIEW_DASHBOARD',   'View dashboard statistics')
ON CONFLICT (id) DO NOTHING;
SELECT setval('public.permission_id_seq', (SELECT MAX(id) FROM public.permission));

-- Role → permission mapping
-- ADMIN (2) and MANAGER (3): full POS access
INSERT INTO public.role_permission (role_id, permission_id)
SELECT r, p
FROM (VALUES (2), (3)) AS roles(r)
CROSS JOIN (VALUES (20), (21), (22), (23), (24), (25), (26)) AS perms(p)
WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permission rp WHERE rp.role_id = roles.r AND rp.permission_id = perms.p
);

-- CASHIER (5): view + sell, no management
INSERT INTO public.role_permission (role_id, permission_id)
SELECT 5, p
FROM (VALUES (20), (22), (24), (25), (26)) AS perms(p)
WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permission rp WHERE rp.role_id = 5 AND rp.permission_id = perms.p
);