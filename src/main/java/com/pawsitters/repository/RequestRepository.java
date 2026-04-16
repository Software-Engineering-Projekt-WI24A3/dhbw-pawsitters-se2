package com.pawsitters.repository;

import com.pawsitters.model.Request;
import com.pawsitters.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RequestRepository extends JpaRepository<Request, Long> {
    List<Request> findByPetOwnerId(Long ownerId);
    List<Request> findByStatus(RequestStatus status);
}