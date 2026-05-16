package com.pawsitters.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;
import java.util.Locale;

@Configuration
public class BookingSchemaMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(BookingSchemaMigrationConfig.class);

    @Bean
    ApplicationRunner bookingProposalStatusColumnMigration(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        return args -> migrateBookingProposalStatusColumn(dataSource, jdbcTemplate);
    }

    private void migrateBookingProposalStatusColumn(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        try (Connection connection = dataSource.getConnection()) {
            String databaseProductName = connection.getMetaData().getDatabaseProductName();
            String normalizedDatabaseName = databaseProductName == null
                    ? ""
                    : databaseProductName.toLowerCase(Locale.ROOT);

            if (!normalizedDatabaseName.contains("mysql") && !normalizedDatabaseName.contains("mariadb")) {
                return;
            }

            List<String> columnTypes = jdbcTemplate.queryForList("""
                    select column_type
                    from information_schema.columns
                    where table_schema = database()
                      and table_name = 'booking_proposals'
                      and column_name = 'status'
                    """, String.class);

            if (columnTypes.isEmpty()) {
                return;
            }

            String columnType = columnTypes.get(0);
            if (columnType != null && columnType.toLowerCase(Locale.ROOT).startsWith("enum(")) {
                jdbcTemplate.execute("alter table booking_proposals modify status varchar(32) not null");
                log.info("Migrated booking_proposals.status from MySQL enum to varchar(32).");
            }
        } catch (Exception ex) {
            log.warn("Could not migrate booking_proposals.status to varchar(32).", ex);
        }
    }
}
