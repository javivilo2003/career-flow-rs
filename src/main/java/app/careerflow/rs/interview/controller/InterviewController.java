package app.careerflow.rs.interview.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.interview.dto.InterviewDTO;
import app.careerflow.rs.interview.dto.InterviewRequest;
import app.careerflow.rs.interview.service.InterviewService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {
    
    private final InterviewService service;

    public InterviewController(InterviewService service) {
        this.service = service;
    }

    @GetMapping()
    public List<InterviewDTO> getAllInterviews(){
        return service.getAllInterviews();
    }

    @GetMapping("{id}")
    public InterviewDTO getInterviewById(@PathVariable UUID id) throws Exception{
        return service.getInterviewById(id);
    }

    @PostMapping
    public void addNewInterview(@Valid @RequestBody InterviewRequest interview) throws ResourceNotFoundException{
        service.addNewInterview(interview);
    }
}
