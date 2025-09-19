-- Initialize database with basic setup
CREATE DATABASE IF NOT EXISTS fullstack_db;
USE fullstack_db;

-- Create basic tables if they don't exist
-- These will be replaced by actual migrations when the app starts

-- Enable general log for debugging (optional)
-- SET GLOBAL general_log = 'ON';
-- SET GLOBAL general_log_file = '/var/log/mysql/general.log';

-- Grant privileges
GRANT ALL PRIVILEGES ON fullstack_db.* TO 'appuser'@'%';
FLUSH PRIVILEGES;
