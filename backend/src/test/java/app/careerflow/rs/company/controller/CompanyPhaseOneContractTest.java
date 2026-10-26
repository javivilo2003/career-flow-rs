package app.careerflow.rs.company.controller;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
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

import app.careerflow.rs.common.error.ApiErrorDetails;
import app.careerflow.rs.common.exception.ConflictException;
import app.careerflow.rs.common.exception.GlobalExceptionHandler;
import app.careerflow.rs.company.dto.CompanyDTO;
import app.careerflow.rs.company.service.CompanyService;

/** Phase 1 HTTP acceptance tests for inline company creation. */
@WebMvcTest(CompanyController.class)
@Import(GlobalExceptionHandler.class)
class CompanyPhaseOneContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CompanyService service;

    @Test
    void createReturns201WithThePersistedCompanyAsTheDirectResponseBody() throws Exception {
        UUID persistedId = UUID.randomUUID();
        CompanyDTO persisted = new CompanyDTO(
            persistedId,
            "Acme",
            "Madrid, Spain",
            "Software company",
            "https://example.com"
        );
        doAnswer(invocation -> persisted)
            .when(service)
            .addNewCompany(argThat(request ->
                "Acme".equals(request.companyName())
                    && "Madrid, Spain".equals(request.companyAddress())
                    && "Software company".equals(request.bio())
                    && "https://example.com".equals(request.websiteUrl())
            ));

        mockMvc.perform(post("/api/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "companyName": "Acme",
                      "companyAddress": "Madrid, Spain",
                      "bio": "Software company",
                      "websiteUrl": "https://example.com"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(persistedId.toString()))
            .andExpect(jsonPath("$.companyName").value("Acme"))
            .andExpect(jsonPath("$.companyAddress").value("Madrid, Spain"))
            .andExpect(jsonPath("$.bio").value("Software company"))
            .andExpect(jsonPath("$.websiteUrl").value("https://example.com"));
    }

    @Test
    void duplicateCompanyNameReturns409UsingTheDocumentedErrorEnvelope() throws Exception {
        doThrow(new ConflictException(
            "Company name already exists.",
            List.of(new ApiErrorDetails("companyName", "companyName must be unique."))
        )).when(service).addNewCompany(argThat(request ->
            "ACME".equals(request.companyName())
        ));

        mockMvc.perform(post("/api/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"companyName":"ACME"}
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("CONFLICT"))
            .andExpect(jsonPath("$.error.message").value("Company name already exists."))
            .andExpect(jsonPath("$.error.details[0].field").value("companyName"))
            .andExpect(jsonPath("$.error.details[0].message").value("companyName must be unique."));
    }
}
