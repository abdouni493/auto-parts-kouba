# FIX: Last Price to Sell Update Issue

## Problem Summary
When updating the "⏱️ Dernier Prix Vente" (Last Selling Price) field and saving, the changes were not being persisted to the database. This was due to the database trigger preventing manual edits.

## Root Cause
The original trigger function (`update_last_price_to_sell`) was designed to automatically update `last_price_to_sell` based on the old `selling_price` value. However, it was **overwriting user manual edits** to the `last_price_to_sell` field, preventing the manual update from being saved.

### Original Trigger Logic (PROBLEMATIC):
```sql
IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
  NEW.last_price_to_sell := OLD.selling_price;  -- Always overwrite!
END IF;
```

This meant:
- User manually edits last_price_to_sell: ❌ Gets overwritten
- User changes selling_price: ✅ Auto-updates last_price_to_sell correctly

## Solution

### UI Changes (COMPLETED ✅)

1. **Inventory Table Columns** - Split combined column into 2 separate columns:
   - `📊 Actuel` - Shows current_quantity
   - `⏱️ Dernier Prix Vente` - Shows last_price_to_sell

2. **POS Table Columns** - Split combined column into 2 separate columns:
   - `📊 Actuel` - Shows current_quantity  
   - `⏱️ Dernier Prix Vente` - Shows last_price_to_sell

### Database Trigger Fix (REQUIRED ⚠️)

**New Trigger Logic (IMPROVED):**
```sql
IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
  -- Only override if user didn't manually change last_price_to_sell
  IF NEW.last_price_to_sell IS NOT DISTINCT FROM OLD.last_price_to_sell THEN
    NEW.last_price_to_sell := OLD.selling_price;
  END IF;
END IF;
```

This allows:
- User manually edits last_price_to_sell: ✅ Gets saved!
- User changes selling_price (without changing last_price_to_sell): ✅ Auto-updates correctly
- User changes both at once: ✅ Both values stick!

## How to Apply the Fix

### Method 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project: https://supabase.com
2. Navigate to **SQL Editor**
3. Click "New Query"
4. Copy and paste the contents of `FIX_LAST_PRICE_TRIGGER.sql`
5. Click **Run** button
6. Verify: "PostgreSQL function updated" and "PostgreSQL trigger updated"

### Method 2: Copy-Paste the SQL

Go to SQL Editor in Supabase and paste:

```sql
-- Fix: Allow manual editing of last_price_to_sell while keeping auto-update feature
DROP TRIGGER IF EXISTS update_last_price_on_change ON public.products;

CREATE OR REPLACE FUNCTION update_last_price_to_sell()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
    IF NEW.last_price_to_sell IS NOT DISTINCT FROM OLD.last_price_to_sell THEN
      NEW.last_price_to_sell := OLD.selling_price;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_price_on_change
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_last_price_to_sell();
```

## Testing the Fix

After applying the migration:

1. **Test Manual Edit:**
   - Open Inventory
   - Click Edit on a product
   - Change the "⏱️ Dernier Prix Vente" field
   - Click Save
   - Refresh the page
   - ✅ Value should persist

2. **Test Auto-Update:**
   - Edit a product again
   - Change only the "💰 Vente" (selling price) field
   - Don't change the "⏱️ Dernier Prix Vente" field
   - Click Save
   - ✅ The "⏱️ Dernier Prix Vente" should automatically update to the old price

3. **Test Both:**
   - Edit a product
   - Change both "💰 Vente" and "⏱️ Dernier Prix Vente" fields
   - Click Save
   - ✅ Both values should be updated as you set them

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `src/pages/Inventory.tsx` | Split table columns (headers & data) | ✅ Complete |
| `src/pages/POS.tsx` | Split table columns (headers & data) | ✅ Complete |
| Database trigger function | Allow manual edits while auto-updating | ⚠️ Requires execution |

## Next Steps

1. ✅ UI changes are already applied
2. ⚠️ **You must apply the SQL migration** using the Supabase dashboard
3. Test the functionality with the steps above

After applying the SQL fix, the inventory interface will work correctly!
