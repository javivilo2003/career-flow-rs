package app.careerflow.rs.note.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.argThat;
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
    void getAllNotesReturnsServiceResults() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getAllNotes()).thenReturn(List.of(
            new NoteDTO(id, UUID.randomUUID(), "Follow up")
        ));

        mockMvc.perform(get("/api/notes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id.toString()))
            .andExpect(jsonPath("$[0].content").value("Follow up"));
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
