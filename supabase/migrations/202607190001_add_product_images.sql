-- Galería de imágenes por producto (HU-03). La imagen principal es siempre
-- la primera del arreglo. image_url se conserva por compatibilidad.
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_images_max_5;

ALTER TABLE public.products
    ADD CONSTRAINT products_images_max_5 CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5);
