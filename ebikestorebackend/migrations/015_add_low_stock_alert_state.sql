-- Migration 015: Persistent low-stock alert deduplication state

ALTER TABLE inventory
ADD COLUMN low_stock_alert_active BOOLEAN NOT NULL DEFAULT FALSE AFTER low_stock_threshold;

UPDATE inventory
SET low_stock_alert_active = (quantity <= low_stock_threshold);
