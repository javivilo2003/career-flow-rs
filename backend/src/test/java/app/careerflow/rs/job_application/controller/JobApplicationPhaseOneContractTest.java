package app.careerflow.rs.job_application.controller;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.common.exception.GlobalExceptionHandler;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.service.JobApplicationService;

/** Phase 1 HTTP acceptance tests for application creation. */
@WebMvcTest(JobApplicationController.class)
@Import(GlobalExceptionHandler.class)
class JobApplicationPhaseOneContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobApplicationService service;

    @Test
    void createWithoutUserIdOrJobTypeReturns201WithPersistedApplication() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID internalOwnerId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        JobApplicationDTO persisted = new JobApplicationDTO(
            applicationId,
            internalOwnerId,
            companyId,
            "Backend Engineer",
            null,
            "Java and Spring",
            null,
            ApplicationStatus.SAVED,
            null,
            "Manual entry",
            null
        );
        doAnswer(invocation -> persisted)
            .when(service)
            .addNewJobApplication(argThat(request ->
                companyId.equals(request.companyId())
                    && "Backend Engineer".equals(request.position())
                    && request.jobType() == null
                    && request.userId() == null
                    && request.status() == ApplicationStatus.SAVED
            ));

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "companyId": "%s",
                      "position": "Backend Engineer",
                      "description": "Java and Spring",
                      "status": "SAVED",
                      "source": "Manual entry"
                    }
                    """.formatted(companyId)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(applicationId.toString()))
            .andExpect(jsonPath("$.userId").value(internalOwnerId.toString()))
            .andExpect(jsonPath("$.companyId").value(companyId.toString()))
            .andExpect(jsonPath("$.position").value("Backend Engineer"))
            .andExpect(jsonPath("$.jobType").doesNotExist())
            .andExpect(jsonPath("$.status").value("SAVED"));
    }
}
