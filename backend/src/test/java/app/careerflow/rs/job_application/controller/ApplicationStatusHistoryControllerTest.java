package app.careerflow.rs.job_application.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.dto.ApplicationStatusEventDTO;
import app.careerflow.rs.job_application.service.ApplicationStatusHistoryService;

@WebMvcTest(ApplicationStatusHistoryController.class)
class ApplicationStatusHistoryControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ApplicationStatusHistoryService service;

    @Test
    void returnsChronologicalHistoryContractIncludingNullablePreviousStatus() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID initialId = UUID.randomUUID();
        UUID changedId = UUID.randomUUID();
        when(service.getHistory(applicationId)).thenReturn(List.of(
            new ApplicationStatusEventDTO(
                initialId, applicationId, null, ApplicationStatus.SAVED,
                Instant.parse("2026-10-28T10:00:00Z")
            ),
            new ApplicationStatusEventDTO(
                changedId, applicationId, ApplicationStatus.SAVED, ApplicationStatus.APPLIED,
                Instant.parse("2026-10-28T11:00:00.123456Z")
            )
        ));

        mockMvc.perform(get("/api/applications/{id}/history", applicationId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(initialId.toString()))
            .andExpect(jsonPath("$[0].applicationId").value(applicationId.toString()))
            .andExpect(jsonPath("$[0].previousStatus").isEmpty())
            .andExpect(jsonPath("$[0].newStatus").value("SAVED"))
            .andExpect(jsonPath("$[0].occurredAt").value("2026-10-28T10:00:00Z"))
            .andExpect(jsonPath("$[1].previousStatus").value("SAVED"))
            .andExpect(jsonPath("$[1].newStatus").value("APPLIED"))
            .andExpect(jsonPath("$[1].occurredAt").value("2026-10-28T11:00:00.123456Z"));

        verify(service).getHistory(applicationId);
    }

    @Test
    void unknownApplicationUsesDocumentedNotFoundEnvelope() throws Exception {
        UUID applicationId = UUID.randomUUID();
        when(service.getHistory(applicationId))
            .thenThrow(new ResourceNotFoundException(applicationId + " not found."));

        mockMvc.perform(get("/api/applications/{id}/history", applicationId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}
