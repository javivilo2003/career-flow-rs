package app.careerflow.rs.company.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.service.CompanyService;

@WebMvcTest(CompanyController.class)
@Import(GlobalExceptionHandler.class)
class CompanyControllerErrorTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CompanyService service;

    @Test
    void createCompanyWithoutNameReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "companyAddress": "625 Parkway Blvd"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("companyName")));

        verifyNoInteractions(service);
    }

    @Test
    void createCompanyWithInvalidWebsiteReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "companyName": "Testing L.S.",
                      "websiteUrl": "not-a-url"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details[*].field", hasItem("websiteUrl")));

        verifyNoInteractions(service);
    }

    @Test
    void getUnknownCompanyReturnsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getCompanyById(id))
            .thenThrow(new ResourceNotFoundException(id + " not found."));

        mockMvc.perform(get("/api/companies/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("NOT_FOUND"))
            .andExpect(jsonPath("$.error.message").value(id + " not found."));
    }

    @Test
    void invalidPaginationReturnsValidationError() throws Exception {
        mockMvc.perform(get("/api/companies").param("size", "0"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(service);
    }

}
