-- ===================================================================
-- PAYMENTS TABLE (Employee Payments)
-- ===================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('salary', 'bonus', 'commission')),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can read payments" ON payments;
DROP POLICY IF EXISTS "Only admins can modify payments" ON payments;

-- Create RLS Policies
CREATE POLICY "Everyone can read payments" ON payments
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify payments" ON payments
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

-- Create indexes for performance
CREATE INDEX idx_payments_employee ON payments(employee_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_type ON payments(type);

-- Add comment for documentation
COMMENT ON TABLE payments IS 'Employee payment history including salaries, bonuses, and commissions';
COMMENT ON COLUMN payments.employee_id IS 'Reference to the employee receiving the payment';
COMMENT ON COLUMN payments.amount IS 'Payment amount in DZD (Algerian Dinar)';
COMMENT ON COLUMN payments.type IS 'Type of payment: salary (monthly salary), bonus (extra payment), or commission (sales commission)';
COMMENT ON COLUMN payments.date IS 'Date the payment was made';
