package app.careerflow.rs.job_application.service;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.mapper.JobApplicationDTOMapper;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class JobApplicationService {
    
    private final JobApplicationRepository repository;
    private final JobApplicationDTOMapper mapper;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private static final Map<String, String> SORT_FIELDS = Map.of(
        "id", "id",
        "createdAt", "createdAt",
        "appliedAt", "appliedAt",
        "position", "position",
        "salary", "salary",
        "status", "status",
        "companyName", "company.companyName"
    );


    public JobApplicationService(JobApplicationRepository repository, JobApplicationDTOMapper mapper, CompanyRepository companyRepository, UserRepository userRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    public Page<JobApplicationDTO> getJobApplications(JobApplicationFilter filter, int page, int size, String sortField, Direction direction) {
        Sort sort = createSafeSort(sortField, direction);
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<JobApplication> specification = createSpecification(filter);

        return repository.findAll(specification, pageable).map(mapper);

    }

    private Sort createSafeSort(
    String requestedField,
    Sort.Direction direction
) {
    String entityProperty = SORT_FIELDS.get(requestedField);

    if (entityProperty == null) {
        throw new InvalidRequestException(
            "Unsupported sorting field: " + requestedField
        );
    }

    return Sort.by(direction, entityProperty);
}

    private Specification<JobApplication> createSpecification(
        JobApplicationFilter filter
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.id() != null) {
                predicates.add(
                    builder.equal(root.get("id"), filter.id())
                );
            }

            if (filter.userId() != null) {
                predicates.add(
                    builder.equal(
                        root.get("user").get("id"),
                        filter.userId()
                    )
                );
            }

            if (filter.companyId() != null) {
                predicates.add(
                    builder.equal(
                        root.get("company").get("id"),
                        filter.companyId()
                    )
                );
            }

            if (hasText(filter.position())) {
                predicates.add(
                    builder.like(
                        builder.lower(root.get("position")),
                        "%" + filter.position().trim().toLowerCase() + "%"
                    )
                );
            }

            if (hasText(filter.jobType())) {
                predicates.add(
                    builder.equal(
                        builder.lower(root.get("jobType")),
                        filter.jobType().trim().toLowerCase()
                    )
                );
            }

            if (filter.minSalary() != null) {
                predicates.add(
                    builder.greaterThanOrEqualTo(
                        root.get("salary"),
                        filter.minSalary()
                    )
                );
            }

            if (filter.maxSalary() != null) {
                predicates.add(
                    builder.lessThanOrEqualTo(
                        root.get("salary"),
                        filter.maxSalary()
                    )
                );
            }

            if (filter.status() != null) {
                predicates.add(
                    builder.equal(root.get("status"), filter.status())
                );
            }

            if (filter.appliedAt() != null) {
                predicates.add(
                    builder.equal(
                        root.get("appliedAt"),
                        filter.appliedAt()
                    )
                );
            }

            if (filter.createdAt() != null) {
                Timestamp start = Timestamp.valueOf(
                    filter.createdAt().atStartOfDay()
                );

                Timestamp end = Timestamp.valueOf(
                    filter.createdAt()
                        .plusDays(1)
                        .atStartOfDay()
                );

                predicates.add(
                    builder.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        start
                    )
                );

                predicates.add(
                    builder.lessThan(
                        root.get("createdAt"),
                        end
                    )
                );
            }

            if (hasText(filter.source())) {
                predicates.add(
                    builder.equal(
                        builder.lower(root.get("source")),
                        filter.source().trim().toLowerCase()
                    )
                );
            }

            return builder.and(
                predicates.toArray(Predicate[]::new)
            );
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public JobApplicationDTO getJobApplicationById(UUID id) throws Exception{
        return repository.findById(id)
            .map(mapper)    
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found."));
    }

    public void addNewJobApplication(JobApplicationRequest request) throws Exception{
        Company company = companyRepository.findById(request.companyId())
            .orElseThrow(() -> new ResourceNotFoundException(request.companyId() + " not found."));

        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new ResourceNotFoundException(request.userId() + " not found."));

        JobApplication application = mapper.toEntity(request, company, user);

        repository.save(application);
    }


}
