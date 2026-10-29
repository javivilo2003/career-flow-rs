package app.careerflow.rs.note.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.note.domain.Note;
import app.careerflow.rs.note.dto.NoteRequest;

class NoteMapperTest {

    private final NoteMapper mapper = new NoteMapper();

    @Test
    void mapsEntityToDto() {
        UUID id = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        Instant createdAt = Instant.parse("2026-10-28T10:00:00Z");
        Instant updatedAt = Instant.parse("2026-10-28T11:00:00Z");
        Note note = Note.builder().id(id)
            .application(JobApplication.builder().id(applicationId).build())
            .content("Remember to follow up")
            .createdAt(createdAt)
            .updatedAt(updatedAt)
            .build();

        var dto = mapper.apply(note);

        assertThat(dto.id()).isEqualTo(id);
        assertThat(dto.jobApplicationId()).isEqualTo(applicationId);
        assertThat(dto.content()).isEqualTo("Remember to follow up");
        assertThat(dto.createdAt()).isEqualTo(createdAt);
        assertThat(dto.updatedAt()).isEqualTo(updatedAt);
    }

    @Test
    void mapsRequestToEntity() {
        UUID applicationId = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(applicationId).build();
        NoteRequest request = new NoteRequest(applicationId, "Remember to follow up");

        Note note = mapper.toEntityNote(request, application);

        assertThat(note.getId()).isNull();
        assertThat(note.getApplication()).isSameAs(application);
        assertThat(note.getContent()).isEqualTo(request.content());
    }
}
