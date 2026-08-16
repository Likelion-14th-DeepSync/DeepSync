CREATE TABLE lifestyle_experiments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    experiment_type VARCHAR(40) NOT NULL,
    experiment_period VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    completed_at DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_lifestyle_experiments_member_status (member_id, status),
    CONSTRAINT fk_lifestyle_experiments_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);

CREATE TABLE experiment_daily_checks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    experiment_id BIGINT NOT NULL,
    record_date DATE NOT NULL,
    achieved BOOLEAN NOT NULL,
    actual_value VARCHAR(100),
    source_type VARCHAR(20) NOT NULL,
    note VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_experiment_daily_checks_experiment_date UNIQUE (experiment_id, record_date),
    CONSTRAINT fk_experiment_daily_checks_experiment
        FOREIGN KEY (experiment_id) REFERENCES lifestyle_experiments (id) ON DELETE CASCADE
);
