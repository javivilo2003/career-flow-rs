package app.careerflow.rs.job_application.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.careerflow.rs.job_application.dto.ApplicationStatusEventDTO;
import app.careerflow.rs.job_application.service.ApplicationStatusHistoryService;
import app.careerflow.rs.common.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/api/applications/{applicationId}/history")
public class ApplicationStatusHistoryController {

    private final ApplicationStatusHistoryService service;

    public ApplicationStatusHistoryController(ApplicationStatusHistoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<ApplicationStatusEventDTO> getHistory(@PathVariable UUID applicationId)
            throws ResourceNotFoundException {
        return service.getHistory(applicationId);
    }
}
