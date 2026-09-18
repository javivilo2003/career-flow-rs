package app.careerflow.rs.job_application.controller;


import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

import app.careerflow.rs.common.exception.GlobalExceptionHandler;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.service.JobApplicationService;

@WebMvcTest(JobApplicationController.class)
@Import(GlobalExceptionHandler.class)
public class JobApplicationControllerErrorTest {
    
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobApplicationService service;

    @Test
    void createApplicationWithMissingRequiredFieldReturnsValidationError() throws Exception {
        String requestBody = """
            {
              "userId": "0c6d7204-3d5f-43ec-9b38-4960bf9d2c41",
              "companyId": "3fb07ed5-d376-424d-8d38-90dcf359bd7c",
              "jobType": "Full-time",
              "status": "PREPARING",
              "source": "LinkedIn"
            }
            """;

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.message").value("One or more fields are invalid."))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("position")));
    }

    @Test
    void createApplicationWithUnknownCompanyReturnsNotFound() throws Exception {
        doThrow(new ResourceNotFoundException("Referenced company was not found."))
            .when(service)
            .addNewJobApplication(any(JobApplicationRequest.class));

        String requestBody = """
            {
            "userId": "0c6d7204-3d5f-43ec-9b38-4960bf9d2c41",
            "companyId": "3fb07ed5-d376-424d-8d38-90dcf359bd7c",
            "position": "Backend Engineer",
            "jobType": "Full-time",
            "status": "PREPARING",
            "source": "LinkedIn"
            }
            """;

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"))
            .andExpect(jsonPath("$.error.message").value("Referenced company was not found."));
    }
}
