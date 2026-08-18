-- Migration 005: Add location_id relationship to users table
-- Fidelo E-Bike Store Inventory System

ALTER TABLE users 
ADD COLUMN location_id INT NULL AFTER role,
ADD CONSTRAINT fk_users_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
