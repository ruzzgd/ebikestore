-- Migration 021: Add birthday, contact number, and address to users table
ALTER TABLE users
    ADD COLUMN birth_date DATE NULL AFTER email,
    ADD COLUMN contact_number VARCHAR(50) NULL AFTER birth_date,
    ADD COLUMN address TEXT NULL AFTER contact_number;
