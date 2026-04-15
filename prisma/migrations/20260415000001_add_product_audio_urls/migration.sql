-- Add product_audio_urls column to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_audio_urls" JSONB NOT NULL DEFAULT '[]';
