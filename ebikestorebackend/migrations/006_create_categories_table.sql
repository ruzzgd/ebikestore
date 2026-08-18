-- Migration 006: Create Categories Table and Seed Master Catalog Categories
-- Fidelo E-Bike Store Inventory System

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Idempotent Seed Data for Master Categories
INSERT INTO categories (name, description, is_active)
VALUES 
    ('E-Bikes', 'Electric bicycle models and fully assembled units', true),
    ('Spare Parts', 'Replacement components, batteries, motors, tires, and repair parts', true),
    ('Accessories', 'Riding gear, helmets, locks, lighting, and storage accessories', true)
ON DUPLICATE KEY UPDATE description = VALUES(description);
