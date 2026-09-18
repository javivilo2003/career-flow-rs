package app.careerflow.rs.followup.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.followup.domain.FollowUp;
import app.careerflow.rs.followup.dto.FollowUpRequest;
import app.careerflow.rs.job_application.domain.JobApplication;

class FollowUpMapperTest {

    private final FollowUpMapper mapper = new FollowUpMapper();

    @Test
    void mapsEntityToDto() {
        UUID applicationId = UUID.randomUUID();
        LocalDate dueDate = LocalDate.of(2026, 10, 1);
        JobApplication application = JobApplication.builder().id(applicationId).build();
        FollowUp followUp = FollowUp.builder().application(application)
            .title("Send email").dueDate(dueDate).completed(true).build();

        var dto = mapper.apply(followUp);

        assertThat(dto.applicationId()).isEqualTo(applicationId);
        assertThat(dto.title()).isEqualTo("Send email");
        assertThat(dto.dueDate()).isEqualTo(dueDate);
        assertThat(dto.completed()).isTrue();
    }

    @Test
    void mapsRequestToEntity() {
        UUID applicationId = UUID.randomUUID();
        LocalDate dueDate = LocalDate.of(2026, 10, 1);
        JobApplication application = JobApplication.builder().id(applicationId).build();
        FollowUpRequest request = new FollowUpRequest(applicationId, "Send email", dueDate, false);

        FollowUp followUp = mapper.toEntityFollowUp(request, application);

        assertThat(followUp.getId()).isNull();
        assertThat(followUp.getApplication()).isSameAs(application);
        assertThat(followUp.getTitle()).isEqualTo(request.title());
        assertThat(followUp.getDueDate()).isEqualTo(request.dueDate());
        assertThat(followUp.isCompleted()).isFalse();
    }
}
