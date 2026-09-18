package app.careerflow.rs.job_application.controller;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.service.JobApplicationService;

@WebMvcTest(JobApplicationController.class)
class JobApplicationControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private JobApplicationService service;

    @Test
    void getApplicationByIdReturnsApplication() throws Exception {
        UUID id = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        when(service.getJobApplicationById(id)).thenReturn(new JobApplicationDTO(
            id, userId, companyId, "Backend Engineer", "Full-time", null,
            null, ApplicationStatus.APPLIED, null, "LinkedIn", null
        ));

        mockMvc.perform(get("/api/applications/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.position").value("Backend Engineer"));

        verify(service).getJobApplicationById(id);
    }

    @Test
    void createApplicationPassesRequestToService() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "userId":"%s",
                      "companyId":"%s",
                      "position":"Backend Engineer",
                      "jobType":"Full-time",
                      "status":"APPLIED",
                      "source":"LinkedIn"
                    }
                    """.formatted(userId, companyId)))
            .andExpect(status().isOk());

        verify(service).addNewJobApplication(argThat(request ->
            userId.equals(request.userId())
                && companyId.equals(request.companyId())
                && request.status() == ApplicationStatus.APPLIED
        ));
    }
}
