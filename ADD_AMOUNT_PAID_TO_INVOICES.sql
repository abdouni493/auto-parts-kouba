-- ===================================================================
-- ADD AMOUNT_PAID COLUMN TO INVOICES TABLE
-- ===================================================================
-- This migration adds the amount_paid column to track how much has been paid
-- for each invoice. This is necessary for proper payment tracking.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) DEFAULT 0;

-- Create index for faster lookups on payment status
CREATE INDEX IF NOT EXISTS idx_invoices_amount_paid ON invoices(amount_paid);
