/**
 * Migration: Add Budget Alerts Table
 *
 * Creates table for tracking budget alert history and preventing duplicate alerts.
 */

-- Create budget_alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_id INTEGER NOT NULL REFERENCES user_budgets(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'over_budget', 'daily_summary'
  alert_level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'critical'
  percentage_used DECIMAL(5, 2), -- Budget percentage at time of alert
  amount_spent DECIMAL(15, 2), -- Amount spent at time of alert
  budget_limit DECIMAL(15, 2), -- Budget limit at time of alert
  message TEXT, -- Alert message
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_alert_type CHECK (alert_type IN ('threshold', 'over_budget', 'daily_summary')),
  CONSTRAINT check_alert_level CHECK (alert_level IN ('info', 'warning', 'critical'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_type ON budget_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_created ON budget_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_email_sent ON budget_alerts(email_sent, created_at);

-- Function to check if alert was recently sent (within last 24 hours)
CREATE OR REPLACE FUNCTION should_send_budget_alert(
  p_user_id INTEGER,
  p_budget_id INTEGER,
  p_alert_type VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_last_alert_time TIMESTAMP;
BEGIN
  -- Get the last time this type of alert was sent for this user/budget
  SELECT MAX(created_at) INTO v_last_alert_time
  FROM budget_alerts
  WHERE user_id = p_user_id
    AND budget_id = p_budget_id
    AND alert_type = p_alert_type
    AND email_sent = TRUE;

  -- If no alert sent yet, or last alert was more than 24 hours ago, send it
  IF v_last_alert_time IS NULL OR (CURRENT_TIMESTAMP - v_last_alert_time) > INTERVAL '24 hours' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get alert statistics
CREATE OR REPLACE FUNCTION get_alert_statistics(
  p_user_id INTEGER DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  alert_type VARCHAR(50),
  alert_level VARCHAR(20),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ba.alert_type,
    ba.alert_level,
    COUNT(*) as count
  FROM budget_alerts ba
  WHERE (p_user_id IS NULL OR ba.user_id = p_user_id)
    AND (p_start_date IS NULL OR ba.created_at >= p_start_date)
    AND (p_end_date IS NULL OR ba.created_at <= p_end_date)
  GROUP BY ba.alert_type, ba.alert_level
  ORDER BY ba.alert_type, ba.alert_level;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE budget_alerts IS 'Tracks all budget alerts sent to users';
COMMENT ON COLUMN budget_alerts.alert_type IS 'Type of alert: threshold, over_budget, or daily_summary';
COMMENT ON COLUMN budget_alerts.alert_level IS 'Severity: info, warning, or critical';
COMMENT ON COLUMN budget_alerts.percentage_used IS 'Budget percentage used when alert was triggered';
COMMENT ON COLUMN budget_alerts.email_sent IS 'Whether the alert email was successfully sent';
COMMENT ON FUNCTION should_send_budget_alert IS 'Checks if an alert should be sent (prevents duplicates within 24 hours)';
COMMENT ON FUNCTION get_alert_statistics IS 'Returns alert statistics for reporting';
