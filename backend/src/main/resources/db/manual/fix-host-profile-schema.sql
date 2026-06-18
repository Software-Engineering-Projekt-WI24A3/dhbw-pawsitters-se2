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
DROP TABLE IF EXISTS user_reviews;
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

CREATE TABLE user_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reviewed_user_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    rating INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_reviews_reviewer_reviewed (reviewer_id, reviewed_user_id),
    KEY idx_user_reviews_reviewed_user (reviewed_user_id),
    KEY idx_user_reviews_reviewer (reviewer_id),
    CONSTRAINT fk_user_reviews_reviewed_user
        FOREIGN KEY (reviewed_user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_reviews_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_user_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

INSERT INTO user_reviews (reviewed_user_id, reviewer_id, rating, created_at, updated_at)
SELECT review.host_id,
       review.pet_owner_id,
       review.rating,
       review.created_at,
       review.created_at
FROM host_reviews review
INNER JOIN (
    SELECT host_id, pet_owner_id, MAX(id) AS latest_review_id
    FROM host_reviews
    WHERE pet_owner_id IS NOT NULL
      AND host_id <> pet_owner_id
    GROUP BY host_id, pet_owner_id
) latest_review
    ON latest_review.latest_review_id = review.id;

UPDATE users target_user
INNER JOIN (
    SELECT reviewed_user_id,
           COUNT(*) AS rating_count,
           AVG(rating) AS average_rating
    FROM user_reviews
    GROUP BY reviewed_user_id
) stats
    ON stats.reviewed_user_id = target_user.id
SET target_user.number_of_ratings = stats.rating_count,
    target_user.rating = stats.average_rating;

INSERT INTO host_profiles (host_id, experience, accommodation_description)
SELECT u.id, '', ''
FROM users u
WHERE u.role = 'HOST'
  AND NOT EXISTS (
      SELECT 1
      FROM host_profiles hp
      WHERE hp.host_id = u.id
  );
