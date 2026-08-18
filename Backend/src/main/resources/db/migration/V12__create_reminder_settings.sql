CREATE TABLE reminder_settings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    reminder_type VARCHAR(40) NOT NULL,
    enabled BOOLEAN NOT NULL,
    reminder_time TIME NOT NULL,
    days_of_week VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_reminder_settings_member_type UNIQUE (member_id, reminder_type),
    CONSTRAINT fk_reminder_settings_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
