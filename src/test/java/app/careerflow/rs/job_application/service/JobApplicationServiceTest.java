package app.careerflow.rs.job_application.service;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Sort;

import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.mapper.JobApplicationMapper;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class JobApplicationServiceTest {

    @Mock
    private JobApplicationRepository repository;

    @Mock 
    private JobApplicationMapper mapper;

    @Mock 
    private CompanyRepository companyRepository;

    @Mock 
    private UserRepository userRepository;

    @InjectMocks 
    private JobApplicationService service;

    @Test 
    void unsupportedSortingFieldIsRejected(){
        JobApplicationFilter emptyFilter = new JobApplicationFilter(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );

        assertThatThrownBy(() -> 
            service.getJobApplications(
                emptyFilter,
                0,
                10,
                "unknownField",
                Sort.Direction.ASC
            )
        )
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage(
                "Unsupported sorting field: unknownField"
            );
        verifyNoInteractions(repository);
    }

    @Test
    void getApplicationByIdReturnsMappedApplication() throws Exception {
        UUID id = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(id).build();
        JobApplicationDTO dto = new JobApplicationDTO(
            id, UUID.randomUUID(), UUID.randomUUID(), "Backend Engineer", "Full-time",
            null, null, ApplicationStatus.APPLIED, null, "LinkedIn", null
        );
        when(repository.findById(id)).thenReturn(Optional.of(application));
        when(mapper.apply(application)).thenReturn(dto);

        assertThat(service.getJobApplicationById(id)).isSameAs(dto);
    }

    @Test
    void getApplicationByIdRejectsUnknownApplication() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getJobApplicationById(id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(id + " not found.");
    }

    @Test
    void addNewApplicationResolvesReferencesAndSavesMappedEntity() throws Exception {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).build();
        User user = User.builder().id(userId).build();
        JobApplicationRequest request = request(userId, companyId);
        JobApplication application = JobApplication.builder().company(company).user(user).build();
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(mapper.toEntity(request, company, user)).thenReturn(application);

        service.addNewJobApplication(request);

        verify(repository).save(application);
    }

    @Test
    void addNewApplicationRejectsUnknownCompany() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        JobApplicationRequest request = request(userId, companyId);
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addNewJobApplication(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(companyId + " not found.");
        verifyNoInteractions(userRepository, mapper, repository);
    }

    @Test
    void addNewApplicationRejectsUnknownUser() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        JobApplicationRequest request = request(userId, companyId);
        when(companyRepository.findById(companyId))
            .thenReturn(Optional.of(Company.builder().id(companyId).build()));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addNewJobApplication(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(userId + " not found.");
        verifyNoInteractions(mapper, repository);
    }

    private JobApplicationRequest request(UUID userId, UUID companyId) {
        return new JobApplicationRequest(
            userId, companyId, "Backend Engineer", "Full-time", null, null,
            ApplicationStatus.APPLIED, null, "LinkedIn", null
        );
    }

}
