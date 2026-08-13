CREATE TABLE skin_goals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    target_date DATE NOT NULL,
    target_concern VARCHAR(30) NOT NULL,
    target_description VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_skin_goals_member_status (member_id, status),
    CONSTRAINT fk_skin_goals_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
