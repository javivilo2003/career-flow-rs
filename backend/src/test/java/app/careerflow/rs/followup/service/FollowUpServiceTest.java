package app.careerflow.rs.followup.service;


import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
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
    void unsupportedSortingFieldIsRejected() {
        FollowUpFilter filter = new FollowUpFilter(null, null, null, null, null, null);

        assertThatThrownBy(() -> service.getFollowUps(
            filter, 0, 10, "unknownField", Sort.Direction.ASC
        ))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Unsupported sorting field: unknownField");
        verifyNoInteractions(repository);
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
    void addNewFollowUpReturnsPersistedResourceWithGeneratedId() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID followUpId = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(applicationId).build();
        FollowUpRequest request = new FollowUpRequest(
            applicationId, "Send email", LocalDate.of(2026, 10, 1), false
        );
        FollowUp followUp = FollowUp.builder().application(application).build();
        FollowUp saved = FollowUp.builder()
            .id(followUpId)
            .application(application)
            .title(request.title())
            .dueDate(request.dueDate())
            .completed(false)
            .build();
        FollowUpDTO dto = new FollowUpDTO(
            followUpId, applicationId, request.title(), request.dueDate(), false
        );
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(mapper.toEntityFollowUp(request, application)).thenReturn(followUp);
        when(repository.save(followUp)).thenReturn(saved);
        when(mapper.apply(saved)).thenReturn(dto);

        assertThat(service.addNewFollowUp(request)).isSameAs(dto);

        verify(repository).save(followUp);
        verify(mapper).apply(saved);
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

    @Test
    void updateFollowUpReplacesAllFieldsIncludingAssociationAndCompletion() throws Exception {
        UUID followUpId = UUID.randomUUID();
        UUID oldApplicationId = UUID.randomUUID();
        UUID newApplicationId = UUID.randomUUID();
        JobApplication oldApplication = JobApplication.builder().id(oldApplicationId).build();
        JobApplication newApplication = JobApplication.builder().id(newApplicationId).build();
        FollowUp followUp = FollowUp.builder()
            .id(followUpId)
            .application(oldApplication)
            .title("Old title")
            .dueDate(LocalDate.of(2026, 10, 27))
            .completed(false)
            .build();
        FollowUpRequest request = new FollowUpRequest(
            newApplicationId, "Completed task", LocalDate.of(2026, 11, 2), true
        );
        FollowUpDTO dto = new FollowUpDTO(
            followUpId, newApplicationId, request.title(), request.dueDate(), true
        );
        when(repository.findById(followUpId)).thenReturn(Optional.of(followUp));
        when(jobApplicationRepository.findById(newApplicationId)).thenReturn(Optional.of(newApplication));
        when(mapper.apply(followUp)).thenReturn(dto);

        assertThat(service.updateFollowUpById(followUpId, request)).isSameAs(dto);
        assertThat(followUp.getApplication()).isSameAs(newApplication);
        assertThat(followUp.getTitle()).isEqualTo("Completed task");
        assertThat(followUp.getDueDate()).isEqualTo(LocalDate.of(2026, 11, 2));
        assertThat(followUp.isCompleted()).isTrue();
        verify(repository).save(followUp);
    }

    @Test
    void updateFollowUpRejectsUnknownFollowUpWithoutResolvingApplication() {
        UUID followUpId = UUID.randomUUID();
        FollowUpRequest request = new FollowUpRequest(
            UUID.randomUUID(), "Task", LocalDate.of(2026, 11, 2), true
        );
        when(repository.findById(followUpId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateFollowUpById(followUpId, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(followUpId + " not found.");
        verifyNoInteractions(jobApplicationRepository, mapper);
    }

    @Test
    void updateFollowUpRejectsUnknownApplicationWithoutSavingMutation() {
        UUID followUpId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        FollowUp followUp = FollowUp.builder().id(followUpId).build();
        FollowUpRequest request = new FollowUpRequest(
            applicationId, "Task", LocalDate.of(2026, 11, 2), true
        );
        when(repository.findById(followUpId)).thenReturn(Optional.of(followUp));
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateFollowUpById(followUpId, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(applicationId + " not found");
        verify(repository).findById(followUpId);
        verifyNoInteractions(mapper);
    }
}
