package app.careerflow.rs.job_application.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

import app.careerflow.rs.common.exception.ConflictException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.service.JobApplicationFilter;
import app.careerflow.rs.job_application.service.JobApplicationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.PutMapping;




@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    private final JobApplicationService service;
    

    public JobApplicationController(JobApplicationService service) {
        this.service = service;
    }
    
    @GetMapping()
    public Page<JobApplicationDTO> getApplications(
        @ModelAttribute JobApplicationFilter filter, 
        @RequestParam(defaultValue = "createdAt") String sort,
        @RequestParam(defaultValue = "DESC") Sort.Direction direction, 
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
    ) {
        return service.getJobApplications(filter, page, size, sort, direction);
    }

    @GetMapping("{id}")
    public JobApplicationDTO getApplicationById(@PathVariable UUID id) throws Exception {
        return service.getJobApplicationById(id);
    }
    
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping()
    public void saveApplication(@Valid @RequestBody JobApplicationRequest request) throws Exception{
        service.addNewJobApplication(request);
    }

    @ResponseStatus(HttpStatus.OK)
    @PutMapping("{id}")
    public JobApplicationDTO putMethodName(@PathVariable UUID id, @Valid @RequestBody JobApplicationRequest request) throws ResourceNotFoundException {
        return service.updateJobApplication(id, request);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("{id}")
    public void deleteApplicationById(@PathVariable UUID id) throws ResourceNotFoundException, ConflictException{
        service.deleteApplicationById(id);
    }

}
