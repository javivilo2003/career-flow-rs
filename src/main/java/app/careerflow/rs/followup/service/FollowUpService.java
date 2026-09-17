package app.careerflow.rs.followup.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.followup.domain.FollowUp;
import app.careerflow.rs.followup.dto.FollowUpDTO;
import app.careerflow.rs.followup.dto.FollowUpRequest;
import app.careerflow.rs.followup.mapper.FollowUpMapper;
import app.careerflow.rs.followup.repository.FollowUpRepository;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class FollowUpService {
    
    private final FollowUpRepository repository;
    private final JobApplicationRepository jobApplicationRepository;
    private final FollowUpMapper mapper;
    private static final Map<String, String> SORT_FIELDS = Map.of(
        "id", "id",
        "title", "title",
        "dueDate", "dueDate",
        "completed", "completed"
    );

    public FollowUpService(FollowUpRepository repository, JobApplicationRepository jobApplicationRepository,
            FollowUpMapper mapper) {
        this.repository = repository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.mapper = mapper;
    }

    public Page<FollowUpDTO> getFollowUps(
        FollowUpFilter filter,
        int page,
        int size,
        String sortField,
        Sort.Direction direction
    ) {
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

    private Specification<FollowUp> createSpecification(FollowUpFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.id() != null) {
                predicates.add(builder.equal(root.get("id"), filter.id()));
            }
            if (filter.applicationId() != null) {
                predicates.add(builder.equal(root.get("application").get("id"), filter.applicationId()));
            }
            if (hasText(filter.title())) {
                predicates.add(builder.like(
                    builder.lower(root.get("title")),
                    "%" + filter.title().trim().toLowerCase() + "%"
                ));
            }
            if (filter.completed() != null) {
                predicates.add(builder.equal(root.get("completed"), filter.completed()));
            }
            if (filter.dueDateFrom() != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("dueDate"), filter.dueDateFrom()));
            }
            if (filter.dueDateTo() != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("dueDate"), filter.dueDateTo()));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public FollowUpDTO getFollowUpById(UUID id) throws ResourceNotFoundException{
        return repository.findById(id)
            .map(mapper)
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found"));
    }
    
    public void addNewFollowUp(FollowUpRequest request)throws ResourceNotFoundException{
        JobApplication application = jobApplicationRepository.findById(request.applicationId())
            .orElseThrow(() -> new ResourceNotFoundException(request.applicationId() + " not found."));

        FollowUp followUp = mapper.toEntityFollowUp(request, application);

        repository.save(followUp);
    }
}
