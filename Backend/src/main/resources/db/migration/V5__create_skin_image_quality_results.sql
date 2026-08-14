CREATE TABLE skin_image_quality_results (
 id BIGINT NOT NULL AUTO_INCREMENT, skin_image_id BIGINT NOT NULL,
 resolution_score INT NOT NULL, lighting_score INT NOT NULL, lighting_uniformity_score INT NOT NULL,
 sharpness_score INT NOT NULL, overall_score INT NOT NULL, quality_status VARCHAR(30) NOT NULL,
 failure_reasons VARCHAR(1000) NOT NULL, model_version VARCHAR(50) NOT NULL, analyzed_at DATETIME(6) NOT NULL,
 created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL, PRIMARY KEY(id),
 CONSTRAINT uk_skin_image_quality_image UNIQUE(skin_image_id),
 CONSTRAINT fk_skin_image_quality_image FOREIGN KEY(skin_image_id) REFERENCES skin_images(id) ON DELETE CASCADE
);
