package app.careerflow.rs.contact.controller;

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
import app.careerflow.rs.contact.dto.ContactDTO;
import app.careerflow.rs.contact.service.ContactService;

@WebMvcTest(ContactController.class)
@Import(GlobalExceptionHandler.class)
class ContactControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ContactService service;

    @Test
    void getContactsPassesFiltersAndPaginationToService() throws Exception {
        UUID id = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        when(service.getContacts(
            argThat(filter -> companyId.equals(filter.companyId()) && "Ada".equals(filter.name())),
            eq(1), eq(5), eq("jobRole"), eq(Sort.Direction.DESC)
        )).thenReturn(new PageImpl<>(
            List.of(new ContactDTO(id, companyId, "Ada", "123", "ada@example.com", "CTO")),
            PageRequest.of(1, 5, Sort.by(Sort.Direction.DESC, "jobRole")),
            6
        ));

        mockMvc.perform(get("/api/contacts")
                .param("companyId", companyId.toString())
                .param("name", "Ada")
                .param("page", "1")
                .param("size", "5")
                .param("sort", "jobRole")
                .param("direction", "DESC"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(id.toString()))
            .andExpect(jsonPath("$.content[0].name").value("Ada"))
            .andExpect(jsonPath("$.number").value(1))
            .andExpect(jsonPath("$.size").value(5))
            .andExpect(jsonPath("$.totalElements").value(6));

        verify(service).getContacts(
            argThat(filter -> companyId.equals(filter.companyId()) && "Ada".equals(filter.name())),
            eq(1), eq(5), eq("jobRole"), eq(Sort.Direction.DESC)
        );
    }

    @Test
    void getUnknownContactReturnsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getContactById(id)).thenThrow(new ResourceNotFoundException(id + " not found."));

        mockMvc.perform(get("/api/contacts/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void createContactPassesValidRequestToService() throws Exception {
        UUID companyId = UUID.randomUUID();
        mockMvc.perform(post("/api/contacts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"companyId":"%s","name":"Ada","jobRole":"CTO"}
                    """.formatted(companyId)))
            .andExpect(status().isOk());

        verify(service).addNewContact(argThat(request ->
            companyId.equals(request.companyId()) && "Ada".equals(request.name())
        ));
    }

    @Test
    void createContactWithoutRequiredFieldsReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/contacts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("companyId")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("name")))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("jobRole")));

        verifyNoInteractions(service);
    }
}
