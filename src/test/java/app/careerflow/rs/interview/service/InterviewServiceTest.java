package app.careerflow.rs.interview.service;

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
import app.careerflow.rs.interview.domain.Interview;
import app.careerflow.rs.interview.domain.InterviewStatus;
import app.careerflow.rs.interview.dto.InterviewDTO;
import app.careerflow.rs.interview.dto.InterviewRequest;
import app.careerflow.rs.interview.mapper.InterviewMapper;
import app.careerflow.rs.interview.repository.InterviewRepository;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;

@ExtendWith(MockitoExtension.class)
class InterviewServiceTest {

    @Mock private InterviewRepository repository;
    @Mock private JobApplicationRepository jobApplicationRepository;
    @Mock private InterviewMapper mapper;
    @InjectMocks private InterviewService service;

    @Test
    void getAllInterviewsMapsEveryEntity() {
        Interview interview = Interview.builder().build();
        when(repository.findAll()).thenReturn(List.of(interview));
        when(mapper.apply(interview)).thenReturn(new InterviewDTO(
            UUID.randomUUID(), UUID.randomUUID(), "Technical",
            InterviewStatus.SCHEDULED, LocalDate.now(), null
        ));

        assertThat(service.getAllInterviews()).hasSize(1);
        verify(mapper).apply(interview);
    }

    @Test
    void getInterviewByIdRejectsUnknownInterview() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getInterviewById(id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(id + " not found");
    }

    @Test
    void addNewInterviewResolvesApplicationAndSavesMappedEntity() throws Exception {
        UUID applicationId = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(applicationId).build();
        InterviewRequest request = new InterviewRequest(
            applicationId, "Technical", InterviewStatus.SCHEDULED, LocalDate.now(), null
        );
        Interview interview = Interview.builder().jobApplication(application).build();
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(mapper.toEntityInterview(request, application)).thenReturn(interview);

        service.addNewInterview(request);

        verify(repository).save(interview);
    }

    @Test
    void addNewInterviewRejectsUnknownApplication() {
        UUID applicationId = UUID.randomUUID();
        InterviewRequest request = new InterviewRequest(
            applicationId, "Technical", InterviewStatus.SCHEDULED, LocalDate.now(), null
        );
        when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addNewInterview(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(applicationId + " not found.");
        verifyNoInteractions(mapper, repository);
    }
}
