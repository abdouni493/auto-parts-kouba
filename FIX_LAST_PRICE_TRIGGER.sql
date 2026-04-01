-- Fix: Allow manual editing of last_price_to_sell while keeping auto-update feature
-- The issue: The original trigger was overwriting user manual edits to last_price_to_sell

-- Step 1: Drop the old trigger that's preventing manual edits
DROP TRIGGER IF EXISTS update_last_price_on_change ON public.products;

-- Step 2: Create a better trigger that:
-- - Allows manual edits to last_price_to_sell (doesn't override user changes)
-- - Auto-updates last_price_to_sell ONLY when selling_price changes
-- - Preserves the manual value if the user explicitly sets it during an update
CREATE OR REPLACE FUNCTION update_last_price_to_sell()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update last_price_to_sell if selling_price changed
  -- AND the user didn't manually change last_price_to_sell in the same update
  IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
    -- Only override if last_price_to_sell wasn't manually changed
    IF NEW.last_price_to_sell IS NOT DISTINCT FROM OLD.last_price_to_sell THEN
      NEW.last_price_to_sell := OLD.selling_price;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate trigger with the new function
CREATE TRIGGER update_last_price_on_change
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_last_price_to_sell();

-- Verification
-- This allows:
-- 1. Manual edits to last_price_to_sell to persist
-- 2. Automatic update of last_price_to_sell when selling_price changes (if user didn't manually set it)
-- 3. User can set both selling_price and last_price_to_sell in same update and both will stick
