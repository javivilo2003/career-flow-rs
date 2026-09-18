package app.careerflow.rs.note.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.note.dto.NoteDTO;
import app.careerflow.rs.note.dto.NoteRequest;
import app.careerflow.rs.note.service.NoteFilter;
import app.careerflow.rs.note.service.NoteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @GetMapping()
    public Page<NoteDTO> getAllNotes(
        @ModelAttribute NoteFilter filter,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "createdAt") String sort,
        @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        return service.getNotes(filter, page, size, sort, direction);
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
