USE eventlab_events;

CREATE TABLE IF NOT EXISTS event (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(100) NOT NULL,
    description TEXT,
    event_date  DATETIME NOT NULL,
    location    VARCHAR(255),
    max_seats   INT NOT NULL,
    CONSTRAINT chk_max_seats CHECK (max_seats > 0)
    );