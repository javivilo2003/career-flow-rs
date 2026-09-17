package app.careerflow.rs.note.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.note.dto.NoteDTO;
import app.careerflow.rs.note.dto.NoteRequest;
import app.careerflow.rs.note.service.NoteService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @GetMapping()
    public List<NoteDTO> getAllNotes(){
        return service.getAllNotes();
    }

    @GetMapping("{id}")
    public NoteDTO getNoteById(@PathVariable UUID id) throws ResourceNotFoundException{
        return service.getNoteById(id);
    }

    @PostMapping()
    public void addNewNote(@Valid @RequestBody NoteRequest request) throws ResourceNotFoundException{
        service.addNewNote(request);
    }
}
