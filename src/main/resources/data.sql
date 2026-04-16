INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, role)
VALUES ('anna.meier@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Anna', 'Meier', '01711234567', '1994-03-12', 'Peter Meier', 'anna.png', 'Tierfreundin mit viel Hundeerfahrung.', 'PET_OWNER');

INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, role)
VALUES ('lukas.schmidt@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Lukas', 'Schmidt', '01721234567', '1991-08-05', 'Maria Schmidt', 'lukas.png', 'Aktiver Tiersitter fuer Wochenendbetreuung.', 'HOST');

INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, role)
VALUES ('sara.wagner@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Sara', 'Wagner', '01731234567', '1997-11-21', 'Tom Wagner', 'sara.png', 'Katzenliebhaberin und flexibel verfuegbar.', 'PET_OWNER');

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Bello', 'Hund', 'Labrador', 4, 'Keine', (SELECT id FROM users WHERE email = 'anna.meier@example.com'));

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Minka', 'Katze', 'Europaeisch Kurzhaar', 2, 'Braucht taeglich Medikamente', (SELECT id FROM users WHERE email = 'sara.wagner@example.com'));

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Rocky', 'Hund', 'Mischling', 7, 'Etwas aengstlich bei Gewitter', (SELECT id FROM users WHERE email = 'anna.meier@example.com'));

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Kiwi', 'Vogel', 'Wellensittich', 1, 'Kaefig nachts abdecken', (SELECT id FROM users WHERE email = 'lukas.schmidt@example.com'));
