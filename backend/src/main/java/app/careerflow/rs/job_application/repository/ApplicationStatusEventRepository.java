package app.careerflow.rs.job_application.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import app.careerflow.rs.job_application.domain.ApplicationStatusEvent;

public interface ApplicationStatusEventRepository extends JpaRepository<ApplicationStatusEvent, UUID> {

    List<ApplicationStatusEvent> findByApplicationIdOrderByOccurredAtAscIdAsc(UUID applicationId);
}
