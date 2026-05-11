INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, rating, number_of_ratings, role, password_change_required)
VALUES ('anna.meier@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Anna', 'Meier', '01711234567', '1994-03-12', 'Peter Meier', 'anna.png', 'Tierfreundin mit viel Hundeerfahrung.', 0.0, 0, 'PET_OWNER', FALSE);

INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, rating, number_of_ratings, role, password_change_required, postal_code, city)
VALUES ('lukas.schmidt@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Lukas', 'Schmidt', '01721234567', '1991-08-05', 'Maria Schmidt', 'lukas.png', 'Aktiver Tiersitter fuer Wochenendbetreuung.', 4.8, 12, 'HOST', FALSE, '68159', 'Mannheim');

INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, rating, number_of_ratings, role, password_change_required, postal_code, city)
VALUES ('mia.fischer@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Mia', 'Fischer', '01741234567', '1992-06-17', 'Ben Fischer', 'mia.png', 'Ruhige Betreuung fuer Katzen und Kleintiere.', 4.6, 8, 'HOST', FALSE, '69115', 'Heidelberg');

INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, rating, number_of_ratings, role, password_change_required, postal_code, city)
VALUES ('noah.becker@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Noah', 'Becker', '01751234567', '1988-02-24', 'Eva Becker', 'noah.png', 'Erfahrener Gastgeber mit grossem Garten.', 4.9, 21, 'HOST', FALSE, '68159', 'Mannheim');

INSERT INTO user_accepted_pet_species (user_id, species)
VALUES ((SELECT id FROM users WHERE email = 'lukas.schmidt@example.com'), 'DOG');

INSERT INTO user_accepted_pet_species (user_id, species)
VALUES ((SELECT id FROM users WHERE email = 'lukas.schmidt@example.com'), 'CAT');

INSERT INTO user_accepted_pet_species (user_id, species)
VALUES ((SELECT id FROM users WHERE email = 'mia.fischer@example.com'), 'CAT');

INSERT INTO user_accepted_pet_species (user_id, species)
VALUES ((SELECT id FROM users WHERE email = 'mia.fischer@example.com'), 'RABBIT');

INSERT INTO user_accepted_pet_species (user_id, species)
VALUES ((SELECT id FROM users WHERE email = 'noah.becker@example.com'), 'DOG');

INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, emergency_contact, profile_picture, bio, rating, number_of_ratings, role, password_change_required)
VALUES ('sara.wagner@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOQxD9jQ2b6K8wF5gQd0mL5m8uM4uQx6K', 'Sara', 'Wagner', '01731234567', '1997-11-21', 'Tom Wagner', 'sara.png', 'Katzenliebhaberin und flexibel verfuegbar.', 0.0, 0, 'PET_OWNER', FALSE);

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Bello', 'DOG', 'Labrador', 4, 'Keine', (SELECT id FROM users WHERE email = 'anna.meier@example.com'));

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Minka', 'CAT', 'Europaeisch Kurzhaar', 2, 'Braucht taeglich Medikamente', (SELECT id FROM users WHERE email = 'sara.wagner@example.com'));

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Rocky', 'DOG', 'Mischling', 7, 'Etwas aengstlich bei Gewitter', (SELECT id FROM users WHERE email = 'anna.meier@example.com'));

INSERT INTO pet (name, species, breed, age, special_needs, owner_id)
VALUES ('Kiwi', 'BUDGIE', 'Wellensittich', 1, 'Kaefig nachts abdecken', (SELECT id FROM users WHERE email = 'lukas.schmidt@example.com'));
