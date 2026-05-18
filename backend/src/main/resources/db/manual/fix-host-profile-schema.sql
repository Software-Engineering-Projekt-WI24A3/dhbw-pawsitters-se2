-- Local repair script for the Host Profile user story.
--
-- Use this only for a local/dev database that fails on startup with:
--   Table 'pawsitters.host_profiles' doesn't exist in engine
--
-- That MySQL/MariaDB error means the database has a stale/broken table
-- metadata entry. The new host tables cannot be inspected or auto-created
-- until the broken entries are dropped.

USE pawsitters;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS host_profile_experiences;
DROP TABLE IF EXISTS host_gallery_images;
DROP TABLE IF EXISTS host_reviews;
DROP TABLE IF EXISTS host_profiles;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE host_profiles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    host_id BIGINT NOT NULL,
    experience VARCHAR(2000) NOT NULL,
    accommodation_description VARCHAR(2000) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_host_profiles_host_id (host_id),
    CONSTRAINT fk_host_profiles_host
        FOREIGN KEY (host_id) REFERENCES users (id)
);

CREATE TABLE host_profile_experiences (
    host_profile_id BIGINT NOT NULL,
    position INT NOT NULL,
    experience VARCHAR(1000) NOT NULL,
    PRIMARY KEY (host_profile_id, position),
    CONSTRAINT fk_host_profile_experiences_profile
        FOREIGN KEY (host_profile_id) REFERENCES host_profiles (id)
);

CREATE TABLE host_gallery_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    host_profile_id BIGINT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_host_gallery_images_profile (host_profile_id),
    CONSTRAINT fk_host_gallery_images_profile
        FOREIGN KEY (host_profile_id) REFERENCES host_profiles (id)
);

CREATE TABLE host_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    host_id BIGINT NOT NULL,
    pet_owner_id BIGINT NULL,
    booking_id BIGINT NULL,
    rating INT NOT NULL,
    communication_rating INT NOT NULL,
    reliability_rating INT NOT NULL,
    care_rating INT NOT NULL,
    comment VARCHAR(1000) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_host_reviews_booking (booking_id),
    KEY idx_host_reviews_host (host_id),
    KEY idx_host_reviews_pet_owner (pet_owner_id),
    CONSTRAINT fk_host_reviews_host
        FOREIGN KEY (host_id) REFERENCES users (id),
    CONSTRAINT fk_host_reviews_pet_owner
        FOREIGN KEY (pet_owner_id) REFERENCES users (id),
    CONSTRAINT fk_host_reviews_booking
        FOREIGN KEY (booking_id) REFERENCES booking_proposals (id)
);

INSERT INTO host_profiles (host_id, experience, accommodation_description)
SELECT u.id, '', ''
FROM users u
WHERE u.role = 'HOST'
  AND NOT EXISTS (
      SELECT 1
      FROM host_profiles hp
      WHERE hp.host_id = u.id
  );
