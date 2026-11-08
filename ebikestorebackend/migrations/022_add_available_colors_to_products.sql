-- Migration 022: Add available_colors to products table
-- Fidelo E-Bike Store Inventory System

ALTER TABLE products
    ADD COLUMN available_colors VARCHAR(255) NULL AFTER description;
