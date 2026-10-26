package app.careerflow.rs.job_application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class JobApplicationPhaseOneServiceContractTest {

    @Mock
    private JobApplicationRepository repository;

    @Mock
    private JobApplicationMapper mapper;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private FollowUpRepository followUpRepository;

    @InjectMocks
    private JobApplicationService service;

    @Test
    void createWithoutUserIdUsesDeterministicInternalOwnerAndReturnsPersistedApplication()
            throws Exception {
        UUID companyId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).build();
        User owner = User.builder().id(JobApplicationService.INTERNAL_OWNER_ID).build();
        JobApplicationRequest request = new JobApplicationRequest(
            null,
            companyId,
            "Backend Engineer",
            null,
            null,
            null,
            ApplicationStatus.SAVED,
            null,
            "Manual entry",
            null
        );
        JobApplication entity = JobApplication.builder()
            .company(company)
            .user(owner)
            .position("Backend Engineer")
            .jobType(null)
            .status(ApplicationStatus.SAVED)
            .source("Manual entry")
            .build();
        JobApplicationDTO persisted = new JobApplicationDTO(
            applicationId,
            JobApplicationService.INTERNAL_OWNER_ID,
            companyId,
            "Backend Engineer",
            null,
            null,
            null,
            ApplicationStatus.SAVED,
            null,
            "Manual entry",
            null
        );
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(JobApplicationService.INTERNAL_OWNER_ID))
            .thenReturn(Optional.of(owner));
        when(mapper.toEntity(request, company, owner)).thenReturn(entity);
        when(repository.save(entity)).thenAnswer(invocation -> {
            entity.setId(applicationId);
            return entity;
        });
        when(mapper.apply(entity)).thenReturn(persisted);

        var result = service.addNewJobApplication(request);

        assertThat(result).isSameAs(persisted);
        assertThat(result.id()).isEqualTo(applicationId);
        assertThat(result.userId()).isEqualTo(JobApplicationService.INTERNAL_OWNER_ID);
        assertThat(result.jobType()).isNull();
        verify(userRepository).findById(JobApplicationService.INTERNAL_OWNER_ID);
        verify(repository).save(entity);
    }
}
