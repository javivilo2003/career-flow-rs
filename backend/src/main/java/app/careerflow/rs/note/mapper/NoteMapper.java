package app.careerflow.rs.note.mapper;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.note.domain.Note;
import app.careerflow.rs.note.dto.NoteDTO;
import app.careerflow.rs.note.dto.NoteRequest;

@Service
public class NoteMapper implements Function<Note, NoteDTO> {

    @Override
    public NoteDTO apply(Note t) {
        return new NoteDTO(
            t.getId(),
            t.getApplication().getId(),
            t.getContent()
        );
    }

    public Note toEntityNote(NoteRequest request, JobApplication application){
        return Note.builder()
            .application(application)
            .content(request.content())
            .build();
    }
    
}
