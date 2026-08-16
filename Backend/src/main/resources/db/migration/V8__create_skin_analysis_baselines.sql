CREATE TABLE skin_analysis_baselines (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    skin_analysis_id BIGINT NOT NULL,
    selected_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_skin_analysis_baselines_member UNIQUE (member_id),
    CONSTRAINT fk_skin_analysis_baselines_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_skin_analysis_baselines_analysis
        FOREIGN KEY (skin_analysis_id) REFERENCES skin_analyses (id) ON DELETE CASCADE
);
