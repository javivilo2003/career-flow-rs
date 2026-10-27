package app.careerflow.rs.job_application.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.common.exception.GlobalExceptionHandler;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.service.JobApplicationService;

@WebMvcTest(JobApplicationController.class)
@Import(GlobalExceptionHandler.class)
class JobApplicationPhaseTwoControllerContractTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private JobApplicationService service;

    @Test
    void listBindsPositionStatusCompanyPaginationAndSortAndReturnsPageMetadata()
            throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        JobApplicationDTO dto = dto(
            applicationId, UUID.randomUUID(), companyId, ApplicationStatus.INTERVIEWING
        );
        PageRequest pageRequest = PageRequest.of(
            1, 2, Sort.by(Sort.Direction.ASC, "company.companyName")
        );
        when(service.getJobApplications(
            argThat(filter ->
                companyId.equals(filter.companyId())
                    && "engineer".equals(filter.position())
                    && filter.status() == ApplicationStatus.INTERVIEWING
            ),
            eq(1),
            eq(2),
            eq("companyName"),
            eq(Sort.Direction.ASC)
        )).thenReturn(new PageImpl<>(List.of(dto), pageRequest, 5));

        mockMvc.perform(get("/api/applications")
                .param("companyId", companyId.toString())
                .param("position", "engineer")
                .param("status", "INTERVIEWING")
                .param("page", "1")
                .param("size", "2")
                .param("sort", "companyName")
                .param("direction", "ASC"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].id").value(applicationId.toString()))
            .andExpect(jsonPath("$.number").value(1))
            .andExpect(jsonPath("$.size").value(2))
            .andExpect(jsonPath("$.totalElements").value(5))
            .andExpect(jsonPath("$.totalPages").value(3))
            .andExpect(jsonPath("$.first").value(false))
            .andExpect(jsonPath("$.last").value(false));
    }

    @Test
    void invalidPageAndSizeReturnValidationErrorWithoutCallingService() throws Exception {
        mockMvc.perform(get("/api/applications")
                .param("page", "-1")
                .param("size", "101"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details", hasSize(2)));

        verifyNoInteractions(service);
    }

    @Test
    void completePutPassesEveryFieldAndReturnsThePersistedRepresentation() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        JobApplicationDTO persisted = dto(
            applicationId, ownerId, companyId, ApplicationStatus.OFFER
        );
        when(service.updateJobApplication(
            eq(applicationId),
            argThat(request ->
                ownerId.equals(request.userId())
                    && companyId.equals(request.companyId())
                    && "Platform Engineer".equals(request.position())
                    && "Full-time".equals(request.jobType())
                    && "Description".equals(request.description())
                    && Integer.valueOf(150_000).equals(request.salary())
                    && request.status() == ApplicationStatus.OFFER
                    && LocalDate.of(2026, 10, 26).equals(request.appliedAt())
                    && "Referral".equals(request.source())
                    && "https://example.com/jobs/1".equals(request.postingLink())
            )
        )).thenReturn(persisted);

        mockMvc.perform(put("/api/applications/{id}", applicationId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "userId":"%s",
                      "companyId":"%s",
                      "position":"Platform Engineer",
                      "jobType":"Full-time",
                      "description":"Description",
                      "salary":150000,
                      "status":"OFFER",
                      "appliedAt":"2026-10-26",
                      "source":"Referral",
                      "postingLink":"https://example.com/jobs/1"
                    }
                    """.formatted(ownerId, companyId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(applicationId.toString()))
            .andExpect(jsonPath("$.userId").value(ownerId.toString()))
            .andExpect(jsonPath("$.companyId").value(companyId.toString()))
            .andExpect(jsonPath("$.status").value("OFFER"));

        verify(service).updateJobApplication(eq(applicationId), argThat(request ->
            request.status() == ApplicationStatus.OFFER
        ));
    }

    private JobApplicationDTO dto(
            UUID id, UUID ownerId, UUID companyId, ApplicationStatus status) {
        return new JobApplicationDTO(
            id,
            ownerId,
            companyId,
            "Platform Engineer",
            "Full-time",
            "Description",
            150_000,
            status,
            LocalDate.of(2026, 10, 26),
            "Referral",
            "https://example.com/jobs/1"
        );
    }
}
