-- ===================================================================
-- ADD CLIENT_NAME COLUMN TO INVOICES TABLE
-- ===================================================================
-- This migration adds the client_name column to store the customer/client name
-- for sales invoices, allowing proper display of the client name in the sales list.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON invoices(client_name);
