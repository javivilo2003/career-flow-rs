package app.careerflow.rs.interview.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import app.careerflow.rs.interview.domain.Interview;

public interface InterviewRepository extends JpaRepository<Interview, UUID>{
}
