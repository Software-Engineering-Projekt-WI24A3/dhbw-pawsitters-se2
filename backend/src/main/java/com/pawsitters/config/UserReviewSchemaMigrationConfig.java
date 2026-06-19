package com.pawsitters.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Locale;

@Configuration
public class UserReviewSchemaMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(UserReviewSchemaMigrationConfig.class);

    @Bean
    ApplicationRunner userReviewsTableMigration(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        return args -> migrateUserReviewsTable(dataSource, jdbcTemplate);
    }

    private void migrateUserReviewsTable(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        try (Connection connection = dataSource.getConnection()) {
            String databaseProductName = connection.getMetaData().getDatabaseProductName();
            String normalizedDatabaseName = databaseProductName == null
                    ? ""
                    : databaseProductName.toLowerCase(Locale.ROOT);

            if (!normalizedDatabaseName.contains("mysql") && !normalizedDatabaseName.contains("mariadb")) {
                return;
            }

            jdbcTemplate.execute("""
                    create table if not exists user_reviews (
                        id bigint not null auto_increment,
                        reviewed_user_id bigint not null,
                        reviewer_id bigint not null,
                        rating int not null,
                        created_at datetime(6) not null,
                        updated_at datetime(6) not null,
                        primary key (id),
                        unique key uk_user_reviews_reviewer_reviewed (reviewer_id, reviewed_user_id),
                        key idx_user_reviews_reviewed_user (reviewed_user_id),
                        key idx_user_reviews_reviewer (reviewer_id),
                        constraint fk_user_reviews_reviewed_user
                            foreign key (reviewed_user_id) references users (id)
                            on delete cascade,
                        constraint fk_user_reviews_reviewer
                            foreign key (reviewer_id) references users (id)
                            on delete cascade,
                        constraint chk_user_reviews_rating check (rating between 1 and 5)
                    )
                    """);
            jdbcTemplate.execute("""
                    insert into user_reviews (reviewed_user_id, reviewer_id, rating, created_at, updated_at)
                    select review.host_id,
                           review.pet_owner_id,
                           review.rating,
                           review.created_at,
                           review.created_at
                    from host_reviews review
                    inner join (
                        select host_id, pet_owner_id, max(id) as latest_review_id
                        from host_reviews
                        where pet_owner_id is not null
                          and host_id <> pet_owner_id
                        group by host_id, pet_owner_id
                    ) latest_review
                        on latest_review.latest_review_id = review.id
                    where not exists (
                        select 1
                        from user_reviews existing_review
                        where existing_review.reviewed_user_id = review.host_id
                          and existing_review.reviewer_id = review.pet_owner_id
                    )
                    """);
            jdbcTemplate.execute("""
                    update users target_user
                    inner join (
                        select reviewed_user_id,
                               count(*) as rating_count,
                               avg(rating) as average_rating
                        from user_reviews
                        group by reviewed_user_id
                    ) stats
                        on stats.reviewed_user_id = target_user.id
                    set target_user.number_of_ratings = stats.rating_count,
                        target_user.rating = stats.average_rating
                    """);
            log.info("Ensured user_reviews table exists and backfilled host reviews.");
        } catch (Exception ex) {
            log.warn("Could not ensure user_reviews table exists.", ex);
        }
    }
}
