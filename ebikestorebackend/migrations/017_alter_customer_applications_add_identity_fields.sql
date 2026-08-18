-- Migration 017: Customer applications identity fields and PII enlargement

ALTER TABLE customer_applications
    MODIFY COLUMN customer_name VARCHAR(1000) NOT NULL,
    MODIFY COLUMN contact_number VARCHAR(1000) NOT NULL,
    MODIFY COLUMN address TEXT NOT NULL,
    ADD COLUMN birth_date DATE NULL AFTER customer_name,
    ADD COLUMN id_type VARCHAR(100) NULL AFTER birth_date,
    ADD COLUMN id_number VARCHAR(1000) NULL AFTER id_type,
    ADD COLUMN id_expiration_date DATE NULL AFTER id_number,
    ADD COLUMN uses_barangay_clearance BOOLEAN NOT NULL DEFAULT FALSE AFTER id_expiration_date,
    ADD COLUMN barangay_clearance_reference VARCHAR(255) NULL AFTER uses_barangay_clearance,
    ADD COLUMN renewal_receipt_present BOOLEAN NOT NULL DEFAULT FALSE AFTER barangay_clearance_reference,
    ADD COLUMN guardian_name VARCHAR(1000) NULL AFTER renewal_receipt_present,
    ADD COLUMN guardian_id_type VARCHAR(100) NULL AFTER guardian_name,
    ADD COLUMN guardian_id_number VARCHAR(1000) NULL AFTER guardian_id_type;
