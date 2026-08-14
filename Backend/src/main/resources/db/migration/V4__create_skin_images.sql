CREATE TABLE skin_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    file_size BIGINT NOT NULL,
    captured_at DATETIME(6) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    makeup_applied BOOLEAN NOT NULL,
    quality_status VARCHAR(30) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_skin_images_storage_key UNIQUE (storage_key),
    INDEX idx_skin_images_member_captured_at (member_id, captured_at),
    CONSTRAINT fk_skin_images_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
