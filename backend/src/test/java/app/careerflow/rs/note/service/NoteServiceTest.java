package app.careerflow.rs.note.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.note.domain.Note;
import app.careerflow.rs.note.dto.NoteDTO;
import app.careerflow.rs.note.dto.NoteRequest;
import app.careerflow.rs.note.mapper.NoteMapper;
import app.careerflow.rs.note.repository.NoteRepository;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock private NoteRepository repository;
    @Mock private JobApplicationRepository jobApplicationRepository;
    @Mock private NoteMapper mapper;
    @InjectMocks private NoteService service;

    @Test
    void unsupportedSortingFieldIsRejected() {
        NoteFilter filter = new NoteFilter(null, null, null, null);

        assertThatThrownBy(() -> service.getNotes(
            filter, 0, 10, "unknownField", Sort.Direction.ASC
        ))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Unsupported sorting field: unknownField");
        verifyNoInteractions(repository);
    }

    @Test
    void getNoteByIdRejectsUnknownNote() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getNoteById(id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(id + " not found");
    }

    @Test
    void addNewNoteResolvesApplicationAndSavesMappedEntity() throws Exception {
        UUID applicationId = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(applicationId).build();
        NoteRequest request = new NoteRequest(applicationId, "Follow up");
        Note note = Note.builder().application(application).content("Follow up").build();
        Note saved = Note.builder().id(UUID.randomUUID()).application(application).content("Follow up").build();
        NoteDTO dto = new NoteDTO(saved.getId(), applicationId, "Follow up");
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(mapper.toEntityNote(request, application)).thenReturn(note);
        when(repository.save(note)).thenReturn(saved);
        when(mapper.apply(saved)).thenReturn(dto);

        assertThat(service.addNewNote(request)).isSameAs(dto);

        verify(repository).save(note);
        verify(mapper).apply(saved);
    }

    @Test
    void addNewNoteRejectsUnknownApplication() {
        UUID applicationId = UUID.randomUUID();
        NoteRequest request = new NoteRequest(applicationId, "Follow up");
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addNewNote(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(applicationId + " not found.");
        verifyNoInteractions(mapper, repository);
    }

    @Test
    void updateNoteCanChangeApplicationAssociationAndContent() throws Exception {
        UUID noteId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(applicationId).build();
        Note note = Note.builder().id(noteId).content("Old").build();
        NoteRequest request = new NoteRequest(applicationId, "Updated");
        NoteDTO dto = new NoteDTO(noteId, applicationId, "Updated");
        when(repository.findById(noteId)).thenReturn(Optional.of(note));
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(mapper.apply(note)).thenReturn(dto);

        assertThat(service.updateNoteById(noteId, request)).isSameAs(dto);
        assertThat(note.getApplication()).isSameAs(application);
        assertThat(note.getContent()).isEqualTo("Updated");
        verify(repository).save(note);
    }

    @Test
    void deleteNoteDeletesOnlyTheResolvedNote() throws Exception {
        UUID noteId = UUID.randomUUID();
        Note note = Note.builder().id(noteId).build();
        when(repository.findById(noteId)).thenReturn(Optional.of(note));

        service.deleteNoteById(noteId);

        verify(repository).delete(note);
    }
}
