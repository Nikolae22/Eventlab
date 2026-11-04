USE eventlab_events;

INSERT INTO event (title, description, event_date, location, max_seats) VALUES
('Meetup Spring Boot', 'Dalle basi alle API REST', DATE_ADD(NOW(), INTERVAL 21 DAY), 'Aula 3', 20),
('Corso MySQL', 'Query e indici', DATE_ADD(NOW(), INTERVAL 28 DAY), 'Aula 1', 2),
('Workshop Docker Compose', 'Avviare più servizi insieme', DATE_ADD(NOW(), INTERVAL 35 DAY), 'Aula 2', 10),
('Evento passato', 'Per testare il rifiuto', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Aula 1', 15);