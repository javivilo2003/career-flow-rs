package app.careerflow.rs.job_application.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;

import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.service.JobApplicationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;



@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    private final JobApplicationService service;

    public JobApplicationController(JobApplicationService service) {
        this.service = service;
    }
    
    @GetMapping()
    public List<JobApplicationDTO> getAllApplications(){
        return service.getAllJobApplications();
    }

    @GetMapping("/sorted")
    public List<JobApplicationDTO> getAllApplicationsSortedBy(
            @RequestParam(defaultValue = "id") String field) {
        return service.getAllJobApplicationsSortedBy(field);
    }

    @GetMapping("/paginationAndSorting")
    public Page<JobApplicationDTO> getAllApplicationsWithPagination(
            @RequestParam(defaultValue = "0") @Min(0) int pageNumber,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize,
            @RequestParam(defaultValue = "id") String field) {       
        return service.getJobApplicationsPagedAndSortedBy(
            pageNumber,
            pageSize,
            field);
    }

    @GetMapping("/filter")
    public Page<JobApplicationDTO> getJobApplicationsByStatus(
        @RequestParam ApplicationStatus status,
        @RequestParam(defaultValue = "0") @Min(0) int pageNumber,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
            return service.getJobApplicationsByStatus(status, pageNumber, pageSize);
        }

    @GetMapping("{id}")
    public JobApplicationDTO getApplicationById(@PathVariable UUID id) throws Exception {
        return service.getJobApplicationById(id);
    }
    
    @PostMapping()
    public void saveApplication(@Valid @RequestBody JobApplicationRequest request) throws Exception{
        service.addNewJobApplication(request);
    }

}
