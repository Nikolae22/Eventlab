USE eventlab_events;

INSERT INTO event (title, description, event_date, location, max_seats) VALUES
('Workshop Java', 'Introduzione a Spring Boot', DATE_ADD(NOW(), INTERVAL 7 DAY), 'Aula 1', 3),
('Seminario Docker', 'Container e Compose', DATE_ADD(NOW(), INTERVAL 14 DAY), 'Aula 2', 30);