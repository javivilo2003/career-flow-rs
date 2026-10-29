package app.careerflow.rs.job_application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.ApplicationStatusEvent;
import app.careerflow.rs.job_application.repository.ApplicationStatusEventRepository;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;

@ExtendWith(MockitoExtension.class)
class ApplicationStatusHistoryServiceTest {

    @Mock private JobApplicationRepository applicationRepository;
    @Mock private ApplicationStatusEventRepository eventRepository;
    @InjectMocks private ApplicationStatusHistoryService service;

    @Test
    void returnsRepositoryOrderedHistoryWithContractFields() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-10-28T12:34:56.123456Z");
        when(applicationRepository.existsById(applicationId)).thenReturn(true);
        when(eventRepository.findByApplicationIdOrderByOccurredAtAscIdAsc(applicationId))
            .thenReturn(List.of(ApplicationStatusEvent.builder()
                .id(eventId)
                .previousStatus(ApplicationStatus.SAVED)
                .newStatus(ApplicationStatus.APPLIED)
                .occurredAt(occurredAt)
                .build()));

        var history = service.getHistory(applicationId);

        assertThat(history).singleElement().satisfies(event -> {
            assertThat(event.id()).isEqualTo(eventId);
            assertThat(event.applicationId()).isEqualTo(applicationId);
            assertThat(event.previousStatus()).isEqualTo(ApplicationStatus.SAVED);
            assertThat(event.newStatus()).isEqualTo(ApplicationStatus.APPLIED);
            assertThat(event.occurredAt()).isEqualTo(occurredAt);
        });
    }

    @Test
    void rejectsHistoryForUnknownApplication() {
        UUID applicationId = UUID.randomUUID();
        when(applicationRepository.existsById(applicationId)).thenReturn(false);

        assertThatThrownBy(() -> service.getHistory(applicationId))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(applicationId + " not found.");
    }
}
