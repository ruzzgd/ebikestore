-- Migration 018: Add requested delivery date and reason for transfer

ALTER TABLE inter_branch_requests
    ADD COLUMN requested_delivery_date DATE NULL AFTER requested_by_user_id,
    ADD COLUMN reason_for_transfer VARCHAR(500) NULL AFTER requested_delivery_date,
    ADD COLUMN pending_reminder_sent_at TIMESTAMP NULL AFTER rejected_at;
