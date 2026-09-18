package app.careerflow.rs.note.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import app.careerflow.rs.note.dto.NoteDTO;
import app.careerflow.rs.note.service.NoteService;

@WebMvcTest(NoteController.class)
@Import(GlobalExceptionHandler.class)
class NoteControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private NoteService service;

    @Test
    void getNotesPassesFiltersAndPaginationToService() throws Exception {
        UUID id = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        when(service.getNotes(
            argThat(filter -> applicationId.equals(filter.jobApplicationId())
                && "Follow up".equals(filter.content())),
            eq(0), eq(5), eq("createdAt"), eq(Sort.Direction.DESC)
        )).thenReturn(new PageImpl<>(
            List.of(new NoteDTO(id, applicationId, "Follow up")),
            PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")),
            1
        ));

        mockMvc.perform(get("/api/notes")
                .param("jobApplicationId", applicationId.toString())
                .param("content", "Follow up")
                .param("size", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(id.toString()))
            .andExpect(jsonPath("$.content[0].content").value("Follow up"))
            .andExpect(jsonPath("$.size").value(5));

        verify(service).getNotes(
            argThat(filter -> applicationId.equals(filter.jobApplicationId())
                && "Follow up".equals(filter.content())),
            eq(0), eq(5), eq("createdAt"), eq(Sort.Direction.DESC)
        );
    }

    @Test
    void getUnknownNoteReturnsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getNoteById(id)).thenThrow(new ResourceNotFoundException(id + " not found"));

        mockMvc.perform(get("/api/notes/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void createNotePassesRequestToService() throws Exception {
        UUID applicationId = UUID.randomUUID();
        mockMvc.perform(post("/api/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"jobApplicationId":"%s","content":"Follow up"}
                    """.formatted(applicationId)))
            .andExpect(status().isOk());

        verify(service).addNewNote(argThat(request ->
            applicationId.equals(request.jobApplicationId())
                && "Follow up".equals(request.content())
        ));
    }

    @Test
    void createNoteWithoutRequiredFieldsReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("jobApplicationId")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("content")));

        verifyNoInteractions(service);
    }
}
