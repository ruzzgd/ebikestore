-- Migration 009: Append-only inventory movement ledger

CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    type ENUM('stock_in', 'stock_out', 'adjustment_in', 'adjustment_out') NOT NULL,
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id VARCHAR(100) NULL,
    note VARCHAR(1000) NULL,
    performed_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_movements_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_movements_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_stock_movements_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_stock_movements_before_nonnegative CHECK (quantity_before >= 0),
    CONSTRAINT chk_stock_movements_after_nonnegative CHECK (quantity_after >= 0),
    INDEX idx_stock_movements_product (product_id),
    INDEX idx_stock_movements_location_created (location_id, created_at),
    INDEX idx_stock_movements_type (type),
    INDEX idx_stock_movements_created (created_at),
    INDEX idx_stock_movements_user (performed_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
