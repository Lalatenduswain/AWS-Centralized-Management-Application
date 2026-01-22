-- AWS Centralized Management Application Database Schema
-- This file contains the complete database schema for the application

-- Create the database (run this separately if needed)
-- CREATE DATABASE aws_central_mgmt;

-- Connect to the database
-- \c aws_central_mgmt;

-- Users table (admin/operator authentication)
-- Stores user credentials for accessing the management application
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table (AWS customer accounts)
-- Stores client information and encrypted AWS credentials
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  aws_account_id VARCHAR(12),
  access_key_id_encrypted TEXT NOT NULL,
  secret_access_key_encrypted TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  region VARCHAR(50) DEFAULT 'us-east-1',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table
-- Tracks all actions performed in the system for audit purposes
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_client_name ON clients(client_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_client_id ON activity_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for clients table
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Password hash generated with bcrypt for 'admin123'
INSERT INTO users (email, password_hash)
VALUES ('admin@example.com', '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully!' AS message;
