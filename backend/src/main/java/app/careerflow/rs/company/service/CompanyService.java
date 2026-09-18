package app.careerflow.rs.company.service;


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
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import app.careerflow.rs.common.exception.ConflictException;
import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.dto.CompanyDTO;
import app.careerflow.rs.company.dto.CompanyRequest;
import app.careerflow.rs.company.mapper.CompanyMapper;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.contact.repository.ContactRepository;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class CompanyService {

    private static final Logger log = LoggerFactory.getLogger(CompanyService.class);
    private final CompanyRepository repository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ContactRepository contactRepository;
    private CompanyMapper mapper = new CompanyMapper();
    private static final Map<String, String> SORT_FIELDS = Map.of(
        "id", "id",
        "companyName", "companyName",
        "companyAddress", "companyAddress",
        "bio", "bio",
        "websiteUrl", "websiteUrl",
        "createdAt", "createdAt"
    );

    public CompanyService(
        CompanyRepository repository,
        JobApplicationRepository jobApplicationRepository,
        ContactRepository contactRepository
    ) {
        this.repository = repository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.contactRepository = contactRepository;
    }

    public Page<CompanyDTO> getCompanies(CompanyFilter filter, int page, int size, String sortField, Direction direction){
        log.debug(
            "Listing companies page={} size={} sort={} direction={}",
            page,
            size,
            sortField,
            direction
        );

        Sort sort = createSafeSort(sortField, direction);
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Company> specification = createSpecification(filter);

        return repository.findAll(specification, pageable).map(mapper);
        
    }

    private Sort createSafeSort(String requestField, Sort.Direction direction){
        String entityProperty = SORT_FIELDS.get(requestField);

        if (entityProperty == null) {
            throw new InvalidRequestException(
                "Unsupported sorting field: " + requestField
            );
        }

        return Sort.by(direction, entityProperty);
    }

    private Specification<Company> createSpecification(CompanyFilter filter){
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.id() != null) {
                predicates.add(
                    builder.equal(root.get("id"), filter.id())
                );
            }

            if (hasText(filter.companyName())) {
                predicates.add(
                    builder.equal(root.get("companyName"), filter.companyName())
                );
            }

            if (hasText(filter.address())) {
                predicates.add(
                    builder.equal(root.get("companyAddress"), filter.address())
                );
            }

            if (hasText(filter.bio())) {
                predicates.add(
                    builder.equal(root.get("bio"), filter.bio())
                );
            }

            if (hasText(filter.website())) {
                predicates.add(
                    builder.equal(root.get("websiteUrl"), filter.website())
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

            return builder.and(
                predicates.toArray(Predicate[]::new)
            );

        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public CompanyDTO getCompanyById(UUID id) throws Exception{
        log.debug("Fetching company id={}", id);
        return repository.findById(id)
            .map(mapper)
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found."));
    }

    public void addNewCompany(CompanyRequest request){
        Company company = mapper.toEntityCompany(request);
        repository.save(company);
        log.info("Created company id={}", company.getId());
    }

    public CompanyDTO updateCompany(UUID id, CompanyRequest request) throws ResourceNotFoundException {
        Company company = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found."));

        company.setCompanyName(request.companyName());
        company.setCompanyAddress(request.companyAddress());
        company.setBio(request.bio());
        company.setWebsiteUrl(request.websiteUrl());

        repository.save(company);
        return mapper.apply(company);
    }

    public void deleteById(UUID id) throws ResourceNotFoundException, ConflictException {
        Company company = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found."));

        if (jobApplicationRepository.existsByCompanyId(id) || contactRepository.existsByCompanyId(id)) {
            throw new ConflictException(
                "Company cannot be deleted while applications or contacts reference it."
            );
        }

        repository.delete(company);
    }
}
