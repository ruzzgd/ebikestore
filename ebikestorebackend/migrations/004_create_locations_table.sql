-- Migration 004: Create Locations Table and Seed Fidelo Operating Locations
-- Fidelo E-Bike Store Inventory System

CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type ENUM('branch', 'warehouse') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_locations_type (type),
    INDEX idx_locations_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Idempotent Seed Data for Fidelo Operating Locations
INSERT INTO locations (code, name, type, is_active)
VALUES 
    ('BULAN', 'Bulan Branch', 'branch', true),
    ('BURABOD', 'Burabod Branch', 'branch', true),
    ('NAGA', 'Naga Warehouse', 'warehouse', true)
ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type);
