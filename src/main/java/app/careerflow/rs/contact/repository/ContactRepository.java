package app.careerflow.rs.contact.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import app.careerflow.rs.contact.domain.Contact;

public interface ContactRepository extends JpaRepository<Contact, UUID>{    
}
