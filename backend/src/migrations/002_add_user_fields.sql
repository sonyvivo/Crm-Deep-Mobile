-- Add PIN and Recovery Key to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_key_hash VARCHAR(255);
