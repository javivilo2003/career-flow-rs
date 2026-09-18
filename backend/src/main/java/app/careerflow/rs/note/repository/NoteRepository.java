package app.careerflow.rs.note.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import app.careerflow.rs.note.domain.Note;

public interface NoteRepository extends JpaRepository<Note, UUID>, JpaSpecificationExecutor<Note>{
}
