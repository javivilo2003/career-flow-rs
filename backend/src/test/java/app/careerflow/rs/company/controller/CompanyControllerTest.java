package app.careerflow.rs.company.controller;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.company.dto.CompanyDTO;
import app.careerflow.rs.company.service.CompanyService;

@WebMvcTest(CompanyController.class)
class CompanyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CompanyService service;

    @Test
    void getCompanyByIdReturnsCompany() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getCompanyById(id)).thenReturn(new CompanyDTO(
            id,
            "Testing L.S.",
            "625 Parkway Blvd",
            "Testing company",
            "https://testing.com/"
        ));

        mockMvc.perform(get("/api/companies/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.companyName").value("Testing L.S."));

        verify(service).getCompanyById(id);
    }

    @Test
    void createCompanyPassesRequestToService() throws Exception {
        mockMvc.perform(post("/api/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "companyName": "Testing L.S.",
                      "companyAddress": "625 Parkway Blvd",
                      "bio": "Testing company",
                      "websiteUrl": "https://testing.com/"
                    }
                    """))
            .andExpect(status().isOk());

        verify(service).addNewCompany(argThat(request ->
            "Testing L.S.".equals(request.companyName())
                && "625 Parkway Blvd".equals(request.companyAddress())
                && "Testing company".equals(request.bio())
                && "https://testing.com/".equals(request.websiteUrl())
        ));
    }
}
