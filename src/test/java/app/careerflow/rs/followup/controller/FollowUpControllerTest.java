package app.careerflow.rs.followup.controller;

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
import app.careerflow.rs.followup.dto.FollowUpDTO;
import app.careerflow.rs.followup.service.FollowUpService;

@WebMvcTest(FollowUpController.class)
@Import(GlobalExceptionHandler.class)
class FollowUpControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private FollowUpService service;

    @Test
    void getAllFollowUpsReturnsServiceResults() throws Exception {
        UUID applicationId = UUID.randomUUID();
        when(service.getAllFollowUps()).thenReturn(List.of(
            new FollowUpDTO(applicationId, "Send email", LocalDate.of(2026, 10, 1), false)
        ));

        mockMvc.perform(get("/api/followups"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].applicationId").value(applicationId.toString()))
            .andExpect(jsonPath("$[0].title").value("Send email"));
    }

    @Test
    void getUnknownFollowUpReturnsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getFollowUpById(id)).thenThrow(new ResourceNotFoundException(id + " not found"));

        mockMvc.perform(get("/api/followups/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void createFollowUpPassesValidRequestToService() throws Exception {
        UUID applicationId = UUID.randomUUID();
        mockMvc.perform(post("/api/followups")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"applicationId":"%s","title":"Send email","dueDate":"2026-10-01","completed":false}
                    """.formatted(applicationId)))
            .andExpect(status().isOk());

        verify(service).addNewFollowUp(argThat(request ->
            applicationId.equals(request.applicationId())
                && LocalDate.of(2026, 10, 1).equals(request.dueDate())
        ));
    }

    @Test
    void createFollowUpWithoutRequiredFieldsReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/followups")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("applicationId")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("title")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("dueDate")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("completed")));

        verifyNoInteractions(service);
    }
}
