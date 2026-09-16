ALTER TABLE delivery_persons
    ADD COLUMN license_data MEDIUMBLOB NULL,
    ADD COLUMN license_original_name VARCHAR(255) NULL,
    ADD COLUMN license_mime_type VARCHAR(100) NULL;
