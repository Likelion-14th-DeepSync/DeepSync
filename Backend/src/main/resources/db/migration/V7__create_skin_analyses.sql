CREATE TABLE skin_analyses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    skin_image_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    redness_score INT NULL,
    trouble_score INT NULL,
    dryness_score INT NULL,
    tone_uniformity_score INT NULL,
    overall_score INT NULL,
    confidence_score INT NULL,
    model_version VARCHAR(100) NULL,
    failure_reason VARCHAR(500) NULL,
    analyzed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_skin_analyses_image UNIQUE (skin_image_id),
    CONSTRAINT fk_skin_analyses_image
        FOREIGN KEY (skin_image_id) REFERENCES skin_images (id) ON DELETE CASCADE,
    INDEX idx_skin_analyses_status (status)
);
