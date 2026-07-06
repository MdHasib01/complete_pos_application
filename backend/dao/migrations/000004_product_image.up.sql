-- Track the Cloudinary public_id for each product image so the image can be
-- removed from Cloudinary when the product (or its image) is deleted.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_public_id text;

