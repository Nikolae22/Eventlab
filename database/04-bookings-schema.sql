USE eventlab_bookings;

CREATE TABLE IF NOT EXISTS booking (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id          BIGINT NOT NULL,
    participant_name  VARCHAR(100) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    created_at        DATETIME NOT NULL,
    CONSTRAINT uk_booking_event_email UNIQUE (event_id, participant_email)
    );