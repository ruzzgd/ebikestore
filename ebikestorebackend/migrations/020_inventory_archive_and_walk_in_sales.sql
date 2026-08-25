-- Migration 020: Soft-archive branch inventory and identify walk-in sales

ALTER TABLE inventory
    ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE AFTER low_stock_alert_active,
    ADD COLUMN archived_at TIMESTAMP NULL AFTER is_archived,
    ADD COLUMN archived_by_user_id INT NULL AFTER archived_at,
    ADD CONSTRAINT fk_inventory_archived_by FOREIGN KEY (archived_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    ADD INDEX idx_inventory_archived (is_archived);

ALTER TABLE stock_movements
    MODIFY COLUMN type ENUM(
        'stock_in',
        'stock_out',
        'adjustment_in',
        'adjustment_out',
        'transfer_out',
        'transfer_in',
        'walk_in_sale'
    ) NOT NULL;
