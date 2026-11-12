USE eventlab_bookings;

INSERT INTO booking (event_id, participant_name, participant_email, created_at) VALUES
(1, 'Mario Rossi',   'mario.rossi@esempio.it',   NOW()),
(1, 'Lucia Bianchi', 'lucia.bianchi@esempio.it', NOW()),
(2, 'Luca Verdi',    'luca.verdi@esempio.it',    NOW()),
(3, 'Anna Neri',     'anna.neri@esempio.it',     NOW()),
(4, 'Paolo Gialli',  'paolo.gialli@esempio.it',  NOW());