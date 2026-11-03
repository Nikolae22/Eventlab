USE eventlab_bookings;

create table if not exists bookin (
     id bigint auto_increment primary key,
    event_id bigint,
    participant_name varchar,
    participant_email varchar,
     created_at  DATETIME NOT NULL,
)