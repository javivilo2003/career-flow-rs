package app.careerflow.rs.contact.service;

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
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.contact.domain.Contact;
import app.careerflow.rs.contact.dto.ContactDTO;
import app.careerflow.rs.contact.dto.ContactRequest;
import app.careerflow.rs.contact.mapper.ContactMapper;
import app.careerflow.rs.contact.repository.ContactRepository;
import jakarta.persistence.criteria.Predicate;

@Service
public class ContactService {

    private final ContactRepository repository;
    private final CompanyRepository companyRepository;
    private final ContactMapper mapper;
    private static final Map<String, String> SORT_FIELDS = Map.of(
        "id", "id",
        "companyName", "company.companyName",
        "name", "name",
        "email", "email",
        "jobRole", "jobRole"
    );

    public ContactService(ContactRepository repository, CompanyRepository companyRepository, ContactMapper mapper) {
        this.repository = repository;
        this.companyRepository = companyRepository;
        this.mapper = mapper;
    }

    public Page<ContactDTO> getContacts(
        ContactFilter filter,
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

    private Specification<Contact> createSpecification(ContactFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.id() != null) {
                predicates.add(builder.equal(root.get("id"), filter.id()));
            }
            if (filter.companyId() != null) {
                predicates.add(builder.equal(root.get("company").get("id"), filter.companyId()));
            }
            if (hasText(filter.name())) {
                predicates.add(builder.like(
                    builder.lower(root.get("name")),
                    "%" + filter.name().trim().toLowerCase() + "%"
                ));
            }
            if (hasText(filter.email())) {
                predicates.add(builder.equal(
                    builder.lower(root.get("email")),
                    filter.email().trim().toLowerCase()
                ));
            }
            if (hasText(filter.jobRole())) {
                predicates.add(builder.like(
                    builder.lower(root.get("jobRole")),
                    "%" + filter.jobRole().trim().toLowerCase() + "%"
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public ContactDTO getContactById(UUID id)throws ResourceNotFoundException{
        return repository.findById(id)
            .map(mapper)
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found."));
    }

    public void addNewContact(ContactRequest request) throws ResourceNotFoundException {
        Company company = companyRepository.findById(request.companyId())
            .orElseThrow(() -> new ResourceNotFoundException(request.companyId() + " not found."));

        Contact contact = mapper.toEntityContact(request, company);

        repository.save(contact);
    }
    
}
