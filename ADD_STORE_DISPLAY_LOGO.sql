-- Add display_name and logo_data columns to stores table
-- This allows stores to have custom display names and logos stored as base64

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS display_name character varying,
ADD COLUMN IF NOT EXISTS logo_data text;

-- Update existing records to use name as display_name if display_name is null
UPDATE public.stores
SET display_name = name
WHERE display_name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.stores.display_name IS 'Display name for the store (can be different from the internal name)';
COMMENT ON COLUMN public.stores.logo_data IS 'Base64 encoded logo image data';