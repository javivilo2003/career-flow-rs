package app.careerflow.rs.user.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.common.exception.GlobalExceptionHandler;
import app.careerflow.rs.common.exception.ConflictException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.user.dto.UserDTO;
import app.careerflow.rs.user.service.UserService;

@WebMvcTest(UserController.class)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private UserService service;

    @Test
    void getAllUsersReturnsServiceResults() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getAllUsers()).thenReturn(List.of(
            new UserDTO(id, "javier", LocalDate.of(1990, 1, 1), "cv.pdf", null)
        ));

        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id.toString()))
            .andExpect(jsonPath("$[0].username").value("javier"));
    }

    @Test
    void getUnknownUserReturnsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getUserById(id))
            .thenThrow(new ResourceNotFoundException("User with id: " + id + " not found"));

        mockMvc.perform(get("/api/users/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void createUserPassesValidRequestToService() throws Exception {
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"javier","dob":"1990-01-01","cv":"cv.pdf"}
                    """))
            .andExpect(status().isOk());

        verify(service).addNewUser(argThat(request ->
            "javier".equals(request.username())
                && LocalDate.of(1990, 1, 1).equals(request.dob())
        ));
    }

    @Test
    void createUserWithoutUsernameReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("username")));

        verifyNoInteractions(service);
    }

    @Test
    void updateUserReturnsUpdatedUser() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.updateUser(eq(id), argThat(request -> "updated".equals(request.username()))))
            .thenReturn(new UserDTO(id, "updated", LocalDate.of(1990, 1, 1), "cv.pdf", null));

        mockMvc.perform(put("/api/users/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"updated","dob":"1990-01-01","cv":"cv.pdf"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.username").value("updated"));
    }

    @Test
    void deleteUserReturnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/users/{id}", id))
            .andExpect(status().isNoContent());

        verify(service).deleteById(id);
    }

    @Test
    void deleteReferencedUserReturnsConflict() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ConflictException("User cannot be deleted while applications reference it."))
            .when(service).deleteById(id);

        mockMvc.perform(delete("/api/users/{id}", id))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }
}
