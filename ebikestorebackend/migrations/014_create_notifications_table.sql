-- Migration 014: Persistent per-user in-app notifications

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM(
        'low_stock',
        'transfer_requested',
        'transfer_approved',
        'transfer_rejected',
        'transfer_dispatched',
        'transfer_received',
        'application_submitted',
        'application_under_review',
        'application_approved',
        'application_rejected',
        'application_completed',
        'application_cancelled'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    reference_type ENUM('inventory', 'inter_branch_request', 'customer_application') NULL,
    reference_id VARCHAR(100) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_notifications_user_created (user_id, created_at),
    INDEX idx_notifications_user_read (user_id, is_read),
    INDEX idx_notifications_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
