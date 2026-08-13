CREATE TABLE members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_members_email UNIQUE (email)
);

CREATE TABLE member_skin_concerns (
    member_id BIGINT NOT NULL,
    concern VARCHAR(30) NOT NULL,
    PRIMARY KEY (member_id, concern),
    CONSTRAINT fk_member_skin_concerns_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
