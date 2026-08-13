CREATE TABLE lifestyle_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    record_date DATE NOT NULL,
    sleep_duration_minutes INT,
    bedtime TIME,
    wake_up_time TIME,
    late_night_meal BOOLEAN,
    water_intake_ml INT,
    source_type VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_lifestyle_records_member_date UNIQUE (member_id, record_date),
    CONSTRAINT fk_lifestyle_records_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);

CREATE TABLE environment_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    record_date DATE NOT NULL,
    uv_index DECIMAL(4,1),
    temperature DECIMAL(4,1),
    humidity INT,
    fine_dust INT,
    source_type VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_environment_records_member_date UNIQUE (member_id, record_date),
    CONSTRAINT fk_environment_records_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
