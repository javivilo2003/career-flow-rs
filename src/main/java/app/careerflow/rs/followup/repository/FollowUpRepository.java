package app.careerflow.rs.followup.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import app.careerflow.rs.followup.domain.FollowUp;

public interface FollowUpRepository extends JpaRepository<FollowUp, UUID>{
}
