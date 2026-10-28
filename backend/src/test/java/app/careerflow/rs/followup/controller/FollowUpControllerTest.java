package app.careerflow.rs.followup.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.followup.dto.FollowUpDTO;
import app.careerflow.rs.followup.service.FollowUpService;

@WebMvcTest(FollowUpController.class)
@Import(GlobalExceptionHandler.class)
class FollowUpControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private FollowUpService service;

    @Test
    void getFollowUpsPassesFiltersAndPaginationToService() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID followUpId = UUID.randomUUID();
        when(service.getFollowUps(
            argThat(filter -> followUpId.equals(filter.id())
                && applicationId.equals(filter.applicationId())
                && "email".equals(filter.title())
                && Boolean.FALSE.equals(filter.completed())
                && LocalDate.of(2026, 10, 27).equals(filter.dueDateFrom())
                && LocalDate.of(2026, 10, 31).equals(filter.dueDateTo())),
            eq(0), eq(5), eq("dueDate"), eq(Sort.Direction.ASC)
        )).thenReturn(new PageImpl<>(
            List.of(new FollowUpDTO(
                followUpId,
                applicationId,
                "Send email",
                LocalDate.of(2026, 10, 31),
                false
            )),
            PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "dueDate")),
            1
        ));

        mockMvc.perform(get("/api/followups")
                .param("id", followUpId.toString())
                .param("applicationId", applicationId.toString())
                .param("title", "email")
                .param("completed", "false")
                .param("dueDateFrom", "2026-10-27")
                .param("dueDateTo", "2026-10-31")
                .param("size", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(followUpId.toString()))
            .andExpect(jsonPath("$.content[0].applicationId").value(applicationId.toString()))
            .andExpect(jsonPath("$.content[0].title").value("Send email"))
            .andExpect(jsonPath("$.content[0].dueDate").value("2026-10-31"))
            .andExpect(jsonPath("$.content[0].completed").value(false))
            .andExpect(jsonPath("$.size").value(5));

        verify(service).getFollowUps(
            argThat(filter -> followUpId.equals(filter.id())
                && applicationId.equals(filter.applicationId())
                && "email".equals(filter.title())
                && Boolean.FALSE.equals(filter.completed())
                && LocalDate.of(2026, 10, 27).equals(filter.dueDateFrom())
                && LocalDate.of(2026, 10, 31).equals(filter.dueDateTo())),
            eq(0), eq(5), eq("dueDate"), eq(Sort.Direction.ASC)
        );
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
    void createFollowUpReturnsPersistedResourceWithIdAndAssociation() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID followUpId = UUID.randomUUID();
        when(service.addNewFollowUp(argThat(request ->
            applicationId.equals(request.applicationId())
                && "Send email".equals(request.title())
                && LocalDate.of(2026, 10, 1).equals(request.dueDate())
                && Boolean.FALSE.equals(request.completed())
        ))).thenReturn(new FollowUpDTO(
            followUpId,
            applicationId,
            "Send email",
            LocalDate.of(2026, 10, 1),
            false
        ));

        mockMvc.perform(post("/api/followups")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"applicationId":"%s","title":"Send email","dueDate":"2026-10-01","completed":false}
                    """.formatted(applicationId)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(followUpId.toString()))
            .andExpect(jsonPath("$.applicationId").value(applicationId.toString()))
            .andExpect(jsonPath("$.title").value("Send email"))
            .andExpect(jsonPath("$.dueDate").value("2026-10-01"))
            .andExpect(jsonPath("$.completed").value(false));

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

    @Test
    void createFollowUpWithUnknownApplicationReturnsNotFound() throws Exception {
        UUID applicationId = UUID.randomUUID();
        when(service.addNewFollowUp(argThat(request -> applicationId.equals(request.applicationId()))))
            .thenThrow(new ResourceNotFoundException(applicationId + " not found."));

        mockMvc.perform(post("/api/followups")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"applicationId":"%s","title":"Send email","dueDate":"2026-10-01","completed":false}
                    """.formatted(applicationId)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void updateFollowUpReturnsFullUpdatedResourceAndCompletion() throws Exception {
        UUID followUpId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        when(service.updateFollowUpById(eq(followUpId), argThat(request ->
            applicationId.equals(request.applicationId())
                && "Thank-you sent".equals(request.title())
                && LocalDate.of(2026, 11, 2).equals(request.dueDate())
                && Boolean.TRUE.equals(request.completed())
        ))).thenReturn(new FollowUpDTO(
            followUpId,
            applicationId,
            "Thank-you sent",
            LocalDate.of(2026, 11, 2),
            true
        ));

        mockMvc.perform(put("/api/followups/{id}", followUpId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"applicationId":"%s","title":"Thank-you sent","dueDate":"2026-11-02","completed":true}
                    """.formatted(applicationId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(followUpId.toString()))
            .andExpect(jsonPath("$.applicationId").value(applicationId.toString()))
            .andExpect(jsonPath("$.title").value("Thank-you sent"))
            .andExpect(jsonPath("$.dueDate").value("2026-11-02"))
            .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void updateFollowUpWithoutRequiredFieldsReturnsValidationError() throws Exception {
        mockMvc.perform(put("/api/followups/{id}", UUID.randomUUID())
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
