CREATE DATABASE IF NOT EXISTS eventlab_events;
CREATE DATABASE IF NOT EXISTS eventlab_bookings;

GRANT ALL PRIVILEGES ON eventlab_events.* TO 'eventlab'@'%';
GRANT ALL PRIVILEGES ON eventlab_bookings.* TO 'eventlab'@'%';
FLUSH PRIVILEGES;