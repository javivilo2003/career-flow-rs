package app.careerflow.rs.interview.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.interview.domain.Interview;
import app.careerflow.rs.interview.domain.InterviewStatus;
import app.careerflow.rs.interview.dto.InterviewRequest;
import app.careerflow.rs.job_application.domain.JobApplication;

class InterviewMapperTest {

    private final InterviewMapper mapper = new InterviewMapper();

    @Test
    void mapsEntityToDto() {
        UUID id = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 10, 2);
        Interview interview = Interview.builder()
            .id(id).jobApplication(JobApplication.builder().id(applicationId).build())
            .stage("Technical").status(InterviewStatus.SCHEDULED)
            .interviewDate(date).notes("Prepare system design").build();

        var dto = mapper.apply(interview);

        assertThat(dto.id()).isEqualTo(id);
        assertThat(dto.jobApplicationId()).isEqualTo(applicationId);
        assertThat(dto.stage()).isEqualTo("Technical");
        assertThat(dto.status()).isEqualTo(InterviewStatus.SCHEDULED);
        assertThat(dto.interviewDate()).isEqualTo(date);
        assertThat(dto.notes()).isEqualTo("Prepare system design");
    }

    @Test
    void mapsRequestToEntity() {
        UUID applicationId = UUID.randomUUID();
        JobApplication application = JobApplication.builder().id(applicationId).build();
        InterviewRequest request = new InterviewRequest(
            applicationId, "Technical", InterviewStatus.SCHEDULED,
            LocalDate.of(2026, 10, 2), "Prepare system design"
        );

        Interview interview = mapper.toEntityInterview(request, application);

        assertThat(interview.getId()).isNull();
        assertThat(interview.getJobApplication()).isSameAs(application);
        assertThat(interview.getStage()).isEqualTo(request.stage());
        assertThat(interview.getStatus()).isEqualTo(request.status());
        assertThat(interview.getInterviewDate()).isEqualTo(request.interviewDate());
        assertThat(interview.getNotes()).isEqualTo(request.notes());
    }
}
