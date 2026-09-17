package app.careerflow.rs.interview.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.common.exception.GlobalExceptionHandler;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.interview.domain.InterviewStatus;
import app.careerflow.rs.interview.dto.InterviewDTO;
import app.careerflow.rs.interview.service.InterviewService;

@WebMvcTest(InterviewController.class)
@Import(GlobalExceptionHandler.class)
class InterviewControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private InterviewService service;

    @Test
    void getAllInterviewsReturnsServiceResults() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getAllInterviews()).thenReturn(List.of(new InterviewDTO(
            id, UUID.randomUUID(), "Technical", InterviewStatus.SCHEDULED,
            LocalDate.of(2026, 10, 2), null
        )));

        mockMvc.perform(get("/api/interviews"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id.toString()))
            .andExpect(jsonPath("$[0].status").value("SCHEDULED"));
    }

    @Test
    void getUnknownInterviewReturnsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getInterviewById(id)).thenThrow(new ResourceNotFoundException(id + " not found"));

        mockMvc.perform(get("/api/interviews/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void createInterviewPassesRequestToService() throws Exception {
        UUID applicationId = UUID.randomUUID();
        mockMvc.perform(post("/api/interviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"jobApplicationId":"%s","stage":"Technical","status":"SCHEDULED","interviewDate":"2026-10-02"}
                    """.formatted(applicationId)))
            .andExpect(status().isOk());

        verify(service).addNewInterview(argThat(request ->
            applicationId.equals(request.jobApplicationId())
                && request.status() == InterviewStatus.SCHEDULED
        ));
    }

    @Test
    void createInterviewWithoutRequiredFieldsReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/interviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("jobApplicationId")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("stage")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("status")));

        verifyNoInteractions(service);
    }
}
