package app.careerflow.rs.user.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import app.careerflow.rs.user.domain.User;

public interface UserRepository extends JpaRepository<User, UUID>{
}
