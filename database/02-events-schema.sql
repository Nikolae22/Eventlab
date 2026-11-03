USE eventlab_events;

CREATE TABLE IF NOT EXISTS event (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    titolo           VARCHAR(100) NOT NULL,
    descrizione      TEXT,
    data_evento      DATETIME NOT NULL,
    luogo            VARCHAR(255),
    capienza_massima INT NOT NULL,
    CONSTRAINT chk_capienza CHECK (capienza_massima > 0)
    );