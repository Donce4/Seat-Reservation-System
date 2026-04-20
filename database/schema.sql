-- Events
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    starts_at TIMESTAMP NOT NULL
);

INSERT INTO events (name, starts_at)
VALUES ('Rock Concert', '2026-05-01 19:00:00');

-- Seats
CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    row_label TEXT NOT NULL,
    seat_number INT NOT NULL
);
INSERT INTO seats (row_label, seat_number)
VALUES
('A', 1),
('A', 2),
('A', 3),
('A', 4),
('A', 5),
('B', 1),
('B', 2),
('B', 3),
('B', 4),
('B', 5);

-- Event seats
CREATE TABLE event_seats (
    event_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (event_id, seat_id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);
INSERT INTO event_seats (event_id, seat_id, status)
VALUES
(1, 1, 'available'),
(1, 2, 'available'),
(1, 3, 'available'),
(1, 4, 'reserved'),
(1, 5, 'available'),
(1, 6, 'available'),
(1, 7, 'available'),
(1, 8, 'reserved'),
(1, 9, 'available'),
(1, 10, 'available');

-- Reservations
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, seat_id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);
INSERT INTO reservations (event_id, seat_id, customer_name, customer_email)
VALUES
(1, 4, 'John Smith', 'john@example.com'),
(1, 8, 'Jane Doe', 'jane@example.com');