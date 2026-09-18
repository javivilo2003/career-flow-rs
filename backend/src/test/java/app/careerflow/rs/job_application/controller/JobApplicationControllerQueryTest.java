package app.careerflow.rs.job_application.controller;

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
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.service.JobApplicationService;

@WebMvcTest(JobApplicationController.class)
@Import(GlobalExceptionHandler.class)
public class JobApplicationControllerQueryTest {
    
    @Autowired 
    private MockMvc mockMvc;

    @MockitoBean 
    private JobApplicationService service;

    @Test 
    void getApplicationsPassesFilterAndPaginationToService() throws Exception{
        
        UUID applicationId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        JobApplicationDTO application = new JobApplicationDTO(
            applicationId,
            UUID.randomUUID(),
            companyId,
            "Backend engineer",
            "Full-time",
            "Java and Spring",
            40_000,
            ApplicationStatus.APPLIED,
            LocalDate.of(2026, 9, 10),
            "LinkedIn",
            "http://example.com/job"
        );

        Page<JobApplicationDTO> serviceResult = new PageImpl<>(
            List.of(application),
            PageRequest.of(
                0, 
                5,
                Sort.by(Sort.Direction.DESC, "createdAt")
            ),
            1
        );

        when(service.getJobApplications(
            argThat(filter ->
                filter.status() == ApplicationStatus.APPLIED
                    && companyId.equals(filter.companyId())
            ), 
            eq(0), 
            eq(5), 
            eq("createdAt"), 
            eq(Sort.Direction.DESC)
        )).thenReturn(serviceResult);  
        
        mockMvc.perform(get("/api/applications")
                .param("status", "APPLIED")
                .param("companyId", companyId.toString())
                .param("page", "0")
                .param("size", "5")
                .param("sort", "createdAt")
                .param("direction", "DESC"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(
                jsonPath("$.content[0].id")
                    .value(applicationId.toString())
            )
            .andExpect(
                jsonPath("$.content[0].position")
                    .value("Backend engineer")
            )
            .andExpect(
                jsonPath("$.content[0].status")
                    .value("APPLIED")   
            );
        verify(service).getJobApplications(
            argThat(filter -> 
                filter.status() == ApplicationStatus.APPLIED
                    && companyId.equals(filter.companyId())
            ), 
            eq(0),
            eq(5),
            eq("createdAt"),
            eq(Sort.Direction.DESC)
        );   
    }
}
