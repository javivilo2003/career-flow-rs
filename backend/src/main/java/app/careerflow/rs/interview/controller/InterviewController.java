package app.careerflow.rs.interview.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.PutMapping;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.interview.dto.InterviewDTO;
import app.careerflow.rs.interview.dto.InterviewRequest;
import app.careerflow.rs.interview.service.InterviewFilter;
import app.careerflow.rs.interview.service.InterviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {
    
    private final InterviewService service;

    public InterviewController(InterviewService service) {
        this.service = service;
    }

    @GetMapping()
    public Page<InterviewDTO> getAllInterviews(
        @ModelAttribute InterviewFilter filter,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "interviewDate") String sort,
        @RequestParam(defaultValue = "ASC") Sort.Direction direction
    ) {
        return service.getInterviews(filter, page, size, sort, direction);
    }

    @GetMapping("{id}")
    public InterviewDTO getInterviewById(@PathVariable UUID id) throws Exception{
        return service.getInterviewById(id);
    }

    @PostMapping
    public void addNewInterview(@Valid @RequestBody InterviewRequest interview) throws ResourceNotFoundException{
        service.addNewInterview(interview);
    }

    @ResponseStatus(HttpStatus.OK)
    @PutMapping("{id}")
    public InterviewDTO updateInterview(
        @PathVariable UUID id,
        @Valid @RequestBody InterviewRequest request
    ) throws ResourceNotFoundException {
        return service.updateInterview(id, request);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("{id}")
    public void deleteInterview(@PathVariable UUID id) throws ResourceNotFoundException {
        service.deleteById(id);
    }
}
