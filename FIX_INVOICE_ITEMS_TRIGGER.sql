-- ===================================================================
-- FIX FOR INVOICE_ITEMS TRIGGER
-- ===================================================================
-- The previous trigger tried to access NEW.type on invoice_items,
-- but the 'type' field exists on the invoices table, not invoice_items.
-- This fix updates the trigger to fetch the type from the related invoice.

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_update_product_quantity ON invoice_items;

-- Create the corrected function
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
  invoice_type VARCHAR;
BEGIN
  -- Get the invoice type from the related invoice
  SELECT type INTO invoice_type FROM invoices WHERE id = NEW.invoice_id;
  
  IF invoice_type = 'sale' THEN
    UPDATE products SET current_quantity = current_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF invoice_type IN ('purchase', 'stock') THEN
    UPDATE products SET current_quantity = current_quantity + NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_product_quantity
AFTER INSERT ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_product_quantity();
