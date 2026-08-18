-- Migration 012: Extend the existing movement ledger for location transfers

ALTER TABLE stock_movements
MODIFY COLUMN type ENUM(
    'stock_in',
    'stock_out',
    'adjustment_in',
    'adjustment_out',
    'transfer_out',
    'transfer_in'
) NOT NULL;
