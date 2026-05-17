package com.pawsitters.repository;

import com.pawsitters.model.HostAvailability;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HostAvailabilityRepository extends JpaRepository<HostAvailability, Long> {

    @EntityGraph(attributePaths = {"host", "daysOfWeek"})
    List<HostAvailability> findByHostIdOrderByStartDateAscIdAsc(Long hostId);

    @EntityGraph(attributePaths = {"host", "daysOfWeek"})
    @Query("""
            select availability
            from HostAvailability availability
            where availability.id = :id
              and lower(availability.host.email) = lower(:hostEmail)
            """)
    Optional<HostAvailability> findByIdAndHostEmail(@Param("id") Long id, @Param("hostEmail") String hostEmail);
}
