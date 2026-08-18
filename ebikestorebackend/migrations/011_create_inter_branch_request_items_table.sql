-- Migration 011: Inter-branch request product lines

CREATE TABLE IF NOT EXISTS inter_branch_request_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    product_id INT NOT NULL,
    quantity_requested INT NOT NULL,
    quantity_dispatched INT NOT NULL DEFAULT 0,
    quantity_received INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inter_branch_request_items_request FOREIGN KEY (request_id) REFERENCES inter_branch_requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inter_branch_request_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_request_items_requested_positive CHECK (quantity_requested > 0),
    CONSTRAINT chk_request_items_dispatched_nonnegative CHECK (quantity_dispatched >= 0),
    CONSTRAINT chk_request_items_received_nonnegative CHECK (quantity_received >= 0),
    CONSTRAINT chk_request_items_dispatched_limit CHECK (quantity_dispatched <= quantity_requested),
    CONSTRAINT chk_request_items_received_limit CHECK (quantity_received <= quantity_dispatched),
    CONSTRAINT uq_inter_branch_request_product UNIQUE (request_id, product_id),
    INDEX idx_inter_branch_request_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
