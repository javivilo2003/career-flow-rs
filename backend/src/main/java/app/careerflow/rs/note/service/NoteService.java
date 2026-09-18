package app.careerflow.rs.note.service;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.note.domain.Note;
import app.careerflow.rs.note.dto.NoteDTO;
import app.careerflow.rs.note.dto.NoteRequest;
import app.careerflow.rs.note.mapper.NoteMapper;
import app.careerflow.rs.note.repository.NoteRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class NoteService {

    private static final Logger log = LoggerFactory.getLogger(NoteService.class);
    private final NoteRepository repository;
    private final JobApplicationRepository jobApplicationRepository;
    private final NoteMapper mapper;
    private static final Map<String, String> SORT_FIELDS = Map.of(
        "id", "id",
        "content", "content",
        "createdAt", "createdAt"
    );
    
    public NoteService(NoteRepository repository, JobApplicationRepository jobApplicationRepository, NoteMapper mapper) {
        this.repository = repository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.mapper = mapper;
    }

    public Page<NoteDTO> getNotes(
        NoteFilter filter,
        int page,
        int size,
        String sortField,
        Sort.Direction direction
    ) {
        log.debug(
            "Listing notes page={} size={} sort={} direction={}",
            page,
            size,
            sortField,
            direction
        );
        Pageable pageable = PageRequest.of(page, size, createSafeSort(sortField, direction));
        return repository.findAll(createSpecification(filter), pageable).map(mapper);
    }

    private Sort createSafeSort(String requestedField, Sort.Direction direction) {
        String entityProperty = SORT_FIELDS.get(requestedField);
        if (entityProperty == null) {
            throw new InvalidRequestException("Unsupported sorting field: " + requestedField);
        }
        return Sort.by(direction, entityProperty);
    }

    private Specification<Note> createSpecification(NoteFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.id() != null) {
                predicates.add(builder.equal(root.get("id"), filter.id()));
            }
            if (filter.jobApplicationId() != null) {
                predicates.add(builder.equal(root.get("application").get("id"), filter.jobApplicationId()));
            }
            if (hasText(filter.content())) {
                predicates.add(builder.like(
                    builder.lower(root.get("content")),
                    "%" + filter.content().trim().toLowerCase() + "%"
                ));
            }
            if (filter.createdAt() != null) {
                Timestamp start = Timestamp.valueOf(filter.createdAt().atStartOfDay());
                Timestamp end = Timestamp.valueOf(filter.createdAt().plusDays(1).atStartOfDay());
                predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), start));
                predicates.add(builder.lessThan(root.get("createdAt"), end));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public NoteDTO getNoteById(UUID id) throws ResourceNotFoundException{
        log.debug("Fetching note id={}", id);
        return repository.findById(id)
            .map(mapper)
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found"));
    }

    public void addNewNote(NoteRequest request) throws ResourceNotFoundException{
        JobApplication application = jobApplicationRepository.findById(request.jobApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException(request.jobApplicationId() + " not found."));

        Note note = mapper.toEntityNote(request, application);
        repository.save(note);
        log.info(
            "Created note id={} applicationId={}",
            note.getId(),
            request.jobApplicationId()
        );
    }
    
    public NoteDTO updateNoteById(UUID id, NoteRequest request) throws ResourceNotFoundException{
        Note note = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException(id + " not found."));
        JobApplication application = jobApplicationRepository.findById(request.jobApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException(request.jobApplicationId() + " not found."));

        note.setApplication(application);
        note.setContent(request.content());

        repository.save(note);
        
        NoteDTO dto = mapper.apply(note);

        return dto;
    }

    public void deleteNoteById(UUID id) throws ResourceNotFoundException{
        Note note = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException(id + " not found."));
        
        repository.delete(note);
    }
}
