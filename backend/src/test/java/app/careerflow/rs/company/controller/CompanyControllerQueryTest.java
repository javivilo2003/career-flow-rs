package app.careerflow.rs.company.controller;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.common.exception.GlobalExceptionHandler;
import app.careerflow.rs.company.dto.CompanyDTO;
import app.careerflow.rs.company.service.CompanyService;

@WebMvcTest(CompanyController.class)
@Import(GlobalExceptionHandler.class)
class CompanyControllerQueryTest {
    
    @Autowired 
    private MockMvc mockMvc;

    @MockitoBean 
    private CompanyService service;

    @Test 
    void getCompaniesPassesFiltersAndPaginationToService() throws Exception {

        UUID id = UUID.randomUUID();
        LocalDate createdAt = LocalDate.of(2026, 9, 17);

        CompanyDTO company = new CompanyDTO(
            id,
            "Testing L.S.",
            "625 Parkway Blvd",
            "Company created for testing",
            "https://testing.com/"
        );

        Page<CompanyDTO> serviceResult = new PageImpl<>(
            List.of(company),
            PageRequest.of(
                0, 
                5,
                Sort.by(Sort.Direction.DESC, "createdAt")
            ),
            1
        );

        when(service.getCompanies(
            argThat(filter ->
                id.equals(filter.id())
                    && "Testing L.S.".equals(filter.companyName())
                    && "625 Parkway Blvd".equals(filter.address())
                    && "Company created for testing".equals(filter.bio())
                    && "https://testing.com/".equals(filter.website())
                    && createdAt.equals(filter.createdAt())
            ), 
            eq(0),
            eq(5),
            eq("createdAt"),
            eq(Sort.Direction.DESC)
        )).thenReturn(serviceResult);

        mockMvc.perform(get("/api/companies")
                .param("id", id.toString())
                .param("companyName", "Testing L.S.")
                .param("address", "625 Parkway Blvd")
                .param("bio", "Company created for testing")
                .param("website", "https://testing.com/")
                .param("createdAt", createdAt.toString())
                .param("page", "0")
                .param("size", "5")
                .param("sort", "createdAt")
                .param("direction", "DESC"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(
                jsonPath("$.content[0].id").value(id.toString())
            )
            .andExpect(
                jsonPath("$.content[0].companyName").value("Testing L.S.")
            )
            .andExpect(
                jsonPath("$.content[0].companyAddress").value("625 Parkway Blvd")
            )
            .andExpect(
                jsonPath("$.content[0].bio").value("Company created for testing")
            )
            .andExpect(
                jsonPath("$.content[0].websiteUrl").value("https://testing.com/")
            )
            .andExpect(jsonPath("$.number").value(0))
            .andExpect(jsonPath("$.size").value(5))
            .andExpect(jsonPath("$.totalElements").value(1));

        verify(service).getCompanies(
            argThat(filter ->
                id.equals(filter.id())
                    && "Testing L.S.".equals(filter.companyName())
                    && "625 Parkway Blvd".equals(filter.address())
                    && "Company created for testing".equals(filter.bio())
                    && "https://testing.com/".equals(filter.website())
                    && createdAt.equals(filter.createdAt())
            ), 
            eq(0),
            eq(5),
            eq("createdAt"),
            eq(Sort.Direction.DESC)
        );
    }

    @Test
    void getCompaniesUsesDefaultPaginationAndSorting() throws Exception {
        when(service.getCompanies(
            argThat(filter ->
                filter.id() == null
                    && filter.companyName() == null
                    && filter.address() == null
                    && filter.bio() == null
                    && filter.website() == null
                    && filter.createdAt() == null
            ),
            eq(0),
            eq(10),
            eq("createdAt"),
            eq(Sort.Direction.DESC)
        )).thenReturn(Page.empty(PageRequest.of(
            0,
            10,
            Sort.by(Sort.Direction.DESC, "createdAt")
        )));

        mockMvc.perform(get("/api/companies"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(0))
            .andExpect(jsonPath("$.number").value(0))
            .andExpect(jsonPath("$.size").value(10))
            .andExpect(jsonPath("$.totalElements").value(0));

        verify(service).getCompanies(
            argThat(filter ->
                filter.id() == null
                    && filter.companyName() == null
                    && filter.address() == null
                    && filter.bio() == null
                    && filter.website() == null
                    && filter.createdAt() == null
            ),
            eq(0),
            eq(10),
            eq("createdAt"),
            eq(Sort.Direction.DESC)
        );
    }
}
