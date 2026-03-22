-- Create Orders (Rental Transactions) Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. RN1021
  product_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  lender_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  borrower_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  base_rental_amount NUMERIC(10, 2) NOT NULL,
  security_deposit NUMERIC(10, 2) DEFAULT 0,
  delivery_charge NUMERIC(10, 2) DEFAULT 0,
  platform_fee NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'OVERDUE')),
  payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  lender_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  issue_description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('REPORTED', 'IN_PROGRESS', 'RESOLVED')),
  estimated_cost NUMERIC(10, 2) DEFAULT 0,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Note: We assume the existing user / listing relationships.
-- A `transactions` (payouts) table can be added later or derived natively from `orders.platform_fee` and `orders.total_amount`.
