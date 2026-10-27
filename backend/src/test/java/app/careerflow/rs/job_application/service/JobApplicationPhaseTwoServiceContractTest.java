package app.careerflow.rs.job_application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.followup.repository.FollowUpRepository;
import app.careerflow.rs.interview.repository.InterviewRepository;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.mapper.JobApplicationMapper;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.note.repository.NoteRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class JobApplicationPhaseTwoServiceContractTest {

    @Mock private JobApplicationRepository repository;
    @Mock private JobApplicationMapper mapper;
    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;
    @Mock private InterviewRepository interviewRepository;
    @Mock private NoteRepository noteRepository;
    @Mock private FollowUpRepository followUpRepository;

    @InjectMocks private JobApplicationService service;

    @ParameterizedTest(name = "sort={0} maps to entity property {1}")
    @MethodSource("supportedSortFields")
    void everyDocumentedSortFieldBuildsTheExpectedPageRequest(
            String requestedField, String entityProperty) {
        JobApplicationFilter filter = emptyFilter();
        when(repository.findAll(
                any(Specification.class),
                any(Pageable.class)))
            .thenReturn(Page.empty());

        service.getJobApplications(filter, 2, 7, requestedField, Sort.Direction.ASC);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAll(any(Specification.class), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isEqualTo(2);
        assertThat(pageable.getValue().getPageSize()).isEqualTo(7);
        assertThat(pageable.getValue().getSort().getOrderFor(entityProperty))
            .isNotNull()
            .extracting(Sort.Order::getDirection)
            .isEqualTo(Sort.Direction.ASC);
        if (!"id".equals(entityProperty)) {
            assertThat(pageable.getValue().getSort().getOrderFor("id"))
                .isNotNull()
                .extracting(Sort.Order::getDirection)
                .isEqualTo(Sort.Direction.ASC);
        }
    }

    @Test
    void completePutUpdatesEveryApplicationFieldWhilePreservingOwnerWhenOmitted()
            throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID oldCompanyId = UUID.randomUUID();
        UUID newCompanyId = UUID.randomUUID();
        User owner = User.builder().id(ownerId).username("owner").build();
        Company oldCompany = Company.builder().id(oldCompanyId).companyName("Old Co").build();
        Company newCompany = Company.builder().id(newCompanyId).companyName("New Co").build();
        JobApplication application = JobApplication.builder()
            .id(applicationId)
            .user(owner)
            .company(oldCompany)
            .position("Old position")
            .jobType("Contract")
            .description("Old description")
            .salary(50_000)
            .status(ApplicationStatus.SAVED)
            .appliedAt(LocalDate.of(2026, 1, 2))
            .source("Old source")
            .postingLink("https://example.com/old")
            .build();
        JobApplicationRequest request = new JobApplicationRequest(
            null,
            newCompanyId,
            "Staff Engineer",
            "Full-time",
            "New description",
            125_000,
            ApplicationStatus.INTERVIEWING,
            LocalDate.of(2026, 10, 25),
            "Referral",
            "https://example.com/new"
        );
        JobApplicationDTO expected = new JobApplicationDTO(
            applicationId,
            ownerId,
            newCompanyId,
            request.position(),
            request.jobType(),
            request.description(),
            request.salary(),
            request.status(),
            request.appliedAt(),
            request.source(),
            request.postingLink()
        );
        when(companyRepository.findById(newCompanyId)).thenReturn(Optional.of(newCompany));
        when(repository.findById(applicationId)).thenReturn(Optional.of(application));
        when(mapper.apply(application)).thenReturn(expected);

        JobApplicationDTO result = service.updateJobApplication(applicationId, request);

        assertThat(result).isSameAs(expected);
        assertThat(application.getUser()).isSameAs(owner);
        assertThat(application.getCompany()).isSameAs(newCompany);
        assertThat(application.getPosition()).isEqualTo("Staff Engineer");
        assertThat(application.getJobType()).isEqualTo("Full-time");
        assertThat(application.getDescription()).isEqualTo("New description");
        assertThat(application.getSalary()).isEqualTo(125_000);
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEWING);
        assertThat(application.getAppliedAt()).isEqualTo(LocalDate.of(2026, 10, 25));
        assertThat(application.getSource()).isEqualTo("Referral");
        assertThat(application.getPostingLink()).isEqualTo("https://example.com/new");
        verify(repository).save(application);
        verify(userRepository, never()).findById(any());
    }

    @Test
    void completePutChangesOwnerOnlyWhenAValidDifferentOwnerIsExplicitlySupplied()
            throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        User oldOwner = User.builder().id(UUID.randomUUID()).username("old-owner").build();
        User newOwner = User.builder().id(UUID.randomUUID()).username("new-owner").build();
        Company company = Company.builder().id(companyId).companyName("Company").build();
        JobApplication application = JobApplication.builder()
            .id(applicationId)
            .user(oldOwner)
            .company(company)
            .build();
        JobApplicationRequest request = request(newOwner.getId(), companyId);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(repository.findById(applicationId)).thenReturn(Optional.of(application));
        when(userRepository.findById(newOwner.getId())).thenReturn(Optional.of(newOwner));

        service.updateJobApplication(applicationId, request);

        assertThat(application.getUser()).isSameAs(newOwner);
        verify(repository).save(application);
    }

    @Test
    void completePutWithUnknownExplicitOwnerDoesNotPersistPartialChanges() {
        UUID applicationId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        UUID unknownOwnerId = UUID.randomUUID();
        User storedOwner = User.builder().id(UUID.randomUUID()).username("stored-owner").build();
        Company company = Company.builder().id(companyId).companyName("Company").build();
        JobApplication application = JobApplication.builder()
            .id(applicationId)
            .user(storedOwner)
            .company(company)
            .position("Original")
            .build();
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(repository.findById(applicationId)).thenReturn(Optional.of(application));
        when(userRepository.findById(unknownOwnerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateJobApplication(
                applicationId,
                request(unknownOwnerId, companyId)))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(unknownOwnerId + " not found.");

        assertThat(application.getUser()).isSameAs(storedOwner);
        assertThat(application.getPosition()).isEqualTo("Original");
        verify(repository, never()).save(any());
    }

    private static Stream<Arguments> supportedSortFields() {
        return Stream.of(
            Arguments.of("id", "id"),
            Arguments.of("createdAt", "createdAt"),
            Arguments.of("appliedAt", "appliedAt"),
            Arguments.of("position", "position"),
            Arguments.of("salary", "salary"),
            Arguments.of("status", "status"),
            Arguments.of("companyName", "company.companyName")
        );
    }

    private JobApplicationFilter emptyFilter() {
        return new JobApplicationFilter(
            null, null, null, null, null, null, null, null, null, null, null
        );
    }

    private JobApplicationRequest request(UUID userId, UUID companyId) {
        return new JobApplicationRequest(
            userId,
            companyId,
            "Updated position",
            "Full-time",
            "Updated description",
            90_000,
            ApplicationStatus.APPLIED,
            LocalDate.of(2026, 10, 20),
            "Referral",
            "https://example.com/job"
        );
    }
}
