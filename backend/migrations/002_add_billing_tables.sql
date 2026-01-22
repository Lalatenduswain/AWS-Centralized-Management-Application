-- Migration 002: Add Billing and Cost Management Tables
-- Created: 2026-01-22
-- Purpose: Enable per-user billing tracking, budgets, and cost allocation

-- ============================================================================
-- Table 1: user_resource_assignments
-- Purpose: Link AWS resources to specific users for cost allocation
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_resource_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Resource identification
  resource_type VARCHAR(50) NOT NULL, -- 'ec2', 's3', 'rds', 'lambda', etc.
  resource_id VARCHAR(255) NOT NULL,  -- AWS resource ID (i-xxx, bucket-name, db-xxx)
  resource_name VARCHAR(255),         -- Friendly name for display

  -- Cost allocation
  cost_center VARCHAR(100),           -- Optional cost center/department/project
  notes TEXT,                         -- Optional notes about this assignment

  -- Metadata
  assigned_by INTEGER REFERENCES users(id), -- Who made the assignment
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT unique_resource_assignment UNIQUE (client_id, resource_type, resource_id)
);

-- Indexes for performance
CREATE INDEX idx_resource_assignments_user ON user_resource_assignments(user_id);
CREATE INDEX idx_resource_assignments_client ON user_resource_assignments(client_id);
CREATE INDEX idx_resource_assignments_type ON user_resource_assignments(resource_type);
CREATE INDEX idx_resource_assignments_lookup ON user_resource_assignments(client_id, resource_type, resource_id);

-- Comments for documentation
COMMENT ON TABLE user_resource_assignments IS 'Links AWS resources to users for cost tracking';
COMMENT ON COLUMN user_resource_assignments.resource_type IS 'AWS service type: ec2, s3, rds, lambda, etc.';
COMMENT ON COLUMN user_resource_assignments.resource_id IS 'AWS resource identifier from AWS API';
COMMENT ON COLUMN user_resource_assignments.cost_center IS 'Optional cost center for organizational billing';

-- ============================================================================
-- Table 2: user_budgets
-- Purpose: Store monthly spending limits and alert thresholds per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Budget configuration
  monthly_limit DECIMAL(10,2) NOT NULL CHECK (monthly_limit >= 0),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Alert thresholds (percentage of budget, 0.0 to 1.0)
  alert_threshold DECIMAL(3,2) DEFAULT 0.80 CHECK (alert_threshold >= 0 AND alert_threshold <= 1),

  -- Alert status
  last_alert_sent TIMESTAMP,
  alerts_enabled BOOLEAN DEFAULT true,

  -- Time period
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,                      -- NULL = ongoing

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),

  -- Constraints
  CONSTRAINT valid_budget_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_user_budgets_user ON user_budgets(user_id);
CREATE INDEX idx_user_budgets_active ON user_budgets(user_id) WHERE end_date IS NULL OR end_date >= CURRENT_DATE;

-- Comments
COMMENT ON TABLE user_budgets IS 'Monthly spending limits and alert thresholds per user';
COMMENT ON COLUMN user_budgets.alert_threshold IS 'Send alert when spending exceeds this % of budget (e.g., 0.80 = 80%)';
COMMENT ON COLUMN user_budgets.monthly_limit IS 'Maximum allowed spending per month in specified currency';

-- ============================================================================
-- Table 3: billing_records
-- Purpose: Store daily cost data per user and resource
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_records (
  id SERIAL PRIMARY KEY,

  -- User and client
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Resource information
  resource_id VARCHAR(255) NOT NULL,  -- AWS resource ID
  resource_type VARCHAR(50) NOT NULL, -- ec2, s3, rds, lambda, etc.
  service_name VARCHAR(100) NOT NULL, -- AWS service name for grouping

  -- Cost data
  cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Usage data
  usage_quantity DECIMAL(15,5),      -- Hours, GB, requests, etc.
  usage_unit VARCHAR(50),            -- 'Hours', 'GB', 'Requests', etc.

  -- Time period
  billing_period VARCHAR(7) NOT NULL, -- 'YYYY-MM' format (e.g., '2026-01')
  billing_date DATE NOT NULL,         -- Specific date for this record

  -- Metadata
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(50) DEFAULT 'aws_cost_explorer',

  -- Constraints
  CONSTRAINT unique_billing_record UNIQUE (user_id, client_id, resource_id, billing_date)
);

-- Indexes for performance (critical for reporting queries)
CREATE INDEX idx_billing_records_user_period ON billing_records(user_id, billing_period);
CREATE INDEX idx_billing_records_date ON billing_records(billing_date DESC);
CREATE INDEX idx_billing_records_client ON billing_records(client_id);
CREATE INDEX idx_billing_records_service ON billing_records(service_name);
CREATE INDEX idx_billing_records_user_date ON billing_records(user_id, billing_date DESC);
CREATE INDEX idx_billing_records_period ON billing_records(billing_period);

-- Comments
COMMENT ON TABLE billing_records IS 'Daily cost tracking per user and AWS resource';
COMMENT ON COLUMN billing_records.billing_period IS 'Month in YYYY-MM format for easy grouping';
COMMENT ON COLUMN billing_records.cost IS 'Cost in specified currency (supports 4 decimal places)';
COMMENT ON COLUMN billing_records.usage_quantity IS 'Amount of resource used (hours, GB, etc.)';

-- ============================================================================
-- Additional indexes for common queries
-- ============================================================================

-- Monthly cost summary (most common query)
CREATE INDEX idx_billing_monthly_summary ON billing_records(user_id, billing_period, service_name);

-- User budget check query
CREATE INDEX idx_billing_current_month ON billing_records(user_id, billing_date)
  WHERE billing_date >= DATE_TRUNC('month', CURRENT_DATE);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get current month billing period
CREATE OR REPLACE FUNCTION get_current_billing_period()
RETURNS VARCHAR(7) AS $$
BEGIN
  RETURN TO_CHAR(CURRENT_DATE, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate user's total cost for a period
CREATE OR REPLACE FUNCTION get_user_cost_for_period(
  p_user_id INTEGER,
  p_billing_period VARCHAR(7)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_cost DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(cost), 0)
  INTO total_cost
  FROM billing_records
  WHERE user_id = p_user_id
    AND billing_period = p_billing_period;

  RETURN total_cost;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user is over budget
CREATE OR REPLACE FUNCTION is_user_over_budget(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_period VARCHAR(7);
  total_cost DECIMAL(10,2);
  budget_limit DECIMAL(10,2);
BEGIN
  current_period := get_current_billing_period();
  total_cost := get_user_cost_for_period(p_user_id, current_period);

  SELECT monthly_limit INTO budget_limit
  FROM user_budgets
  WHERE user_id = p_user_id
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  ORDER BY created_at DESC
  LIMIT 1;

  IF budget_limit IS NULL THEN
    RETURN false; -- No budget set
  END IF;

  RETURN total_cost > budget_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_resource_assignments_updated_at
  BEFORE UPDATE ON user_resource_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_budgets_updated_at
  BEFORE UPDATE ON user_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data (for testing - remove in production)
-- ============================================================================

-- Insert sample budget for user ID 1 (if exists)
INSERT INTO user_budgets (user_id, monthly_limit, alert_threshold, alerts_enabled)
SELECT 1, 1000.00, 0.80, true
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Billing tables created successfully!';
  RAISE NOTICE 'Tables: user_resource_assignments, user_budgets, billing_records';
  RAISE NOTICE 'Indexes: 15 indexes created for performance';
  RAISE NOTICE 'Functions: 3 helper functions created';
END $$;
