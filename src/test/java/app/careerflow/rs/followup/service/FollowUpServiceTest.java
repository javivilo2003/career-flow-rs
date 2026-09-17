package app.careerflow.rs.followup.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.followup.domain.FollowUp;
import app.careerflow.rs.followup.dto.FollowUpDTO;
import app.careerflow.rs.followup.dto.FollowUpRequest;
import app.careerflow.rs.followup.mapper.FollowUpMapper;
import app.careerflow.rs.followup.repository.FollowUpRepository;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;

@ExtendWith(MockitoExtension.class)
class FollowUpServiceTest {

    @Mock private FollowUpRepository repository;
    @Mock private JobApplicationRepository jobApplicationRepository;
    @Mock private FollowUpMapper mapper;
    @InjectMocks private FollowUpService service;

    @Test
    void getAllFollowUpsMapsEveryEntity() {
        FollowUp followUp = FollowUp.builder().build();
        when(repository.findAll()).thenReturn(List.of(followUp));
        when(mapper.apply(followUp)).thenReturn(
            new FollowUpDTO(UUID.randomUUID(), "Send email", LocalDate.now(), false)
        );

        assertThat(service.getAllFollowUps()).hasSize(1);
        verify(mapper).apply(followUp);
    }

    @Test
    void getFollowUpByIdRejectsUnknownFollowUp() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getFollowUpById(id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(id + " not found");
    }

    @Test
    void addNewFollowUpResolvesApplicationAndSavesMappedEntity() throws Exception {
        UUID applicationId = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(applicationId).build();
        FollowUpRequest request = new FollowUpRequest(
            applicationId, "Send email", LocalDate.of(2026, 10, 1), false
        );
        FollowUp followUp = FollowUp.builder().application(application).build();
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(mapper.toEntityFollowUp(request, application)).thenReturn(followUp);

        service.addNewFollowUp(request);

        verify(repository).save(followUp);
    }

    @Test
    void addNewFollowUpRejectsUnknownApplication() {
        UUID applicationId = UUID.randomUUID();
        FollowUpRequest request = new FollowUpRequest(
            applicationId, "Send email", LocalDate.of(2026, 10, 1), false
        );
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addNewFollowUp(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(applicationId + " not found.");
        verifyNoInteractions(mapper, repository);
    }
}
