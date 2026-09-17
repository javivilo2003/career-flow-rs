package app.careerflow.rs.interview.service;

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
import app.careerflow.rs.interview.domain.Interview;
import app.careerflow.rs.interview.dto.InterviewDTO;
import app.careerflow.rs.interview.dto.InterviewRequest;
import app.careerflow.rs.interview.mapper.InterviewMapper;
import app.careerflow.rs.interview.repository.InterviewRepository;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class InterviewService {
    
    private final InterviewRepository repository;
    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewMapper mapper;
    private static final Map<String, String> SORT_FIELDS = Map.of(
        "id", "id",
        "stage", "stage",
        "status", "status",
        "interviewDate", "interviewDate"
    );
    

    public InterviewService(InterviewRepository repository,JobApplicationRepository jobApplicationRepository, InterviewMapper interviewMapper) {
        this.repository = repository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.mapper = interviewMapper;
    }

    public Page<InterviewDTO> getInterviews(
        InterviewFilter filter,
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

    private Specification<Interview> createSpecification(InterviewFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.id() != null) {
                predicates.add(builder.equal(root.get("id"), filter.id()));
            }
            if (filter.jobApplicationId() != null) {
                predicates.add(builder.equal(
                    root.get("jobApplication").get("id"),
                    filter.jobApplicationId()
                ));
            }
            if (hasText(filter.stage())) {
                predicates.add(builder.like(
                    builder.lower(root.get("stage")),
                    "%" + filter.stage().trim().toLowerCase() + "%"
                ));
            }
            if (filter.status() != null) {
                predicates.add(builder.equal(root.get("status"), filter.status()));
            }
            if (filter.interviewDateFrom() != null) {
                predicates.add(builder.greaterThanOrEqualTo(
                    root.get("interviewDate"),
                    filter.interviewDateFrom()
                ));
            }
            if (filter.interviewDateTo() != null) {
                predicates.add(builder.lessThanOrEqualTo(
                    root.get("interviewDate"),
                    filter.interviewDateTo()
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public InterviewDTO getInterviewById(UUID id) throws Exception{
        return repository.findById(id)
            .map(mapper)
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found"));
    }

    public void addNewInterview(InterviewRequest request) throws ResourceNotFoundException{
        JobApplication application = jobApplicationRepository.findById(request.jobApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException(request.jobApplicationId() + " not found."));

        Interview interview = mapper.toEntityInterview(request, application);
        repository.save(interview);
    }
}
