package app.careerflow.rs.job_application.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.dto.ApplicationStatusEventDTO;
import app.careerflow.rs.job_application.repository.ApplicationStatusEventRepository;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;

@Service
public class ApplicationStatusHistoryService {

    private final JobApplicationRepository applicationRepository;
    private final ApplicationStatusEventRepository eventRepository;

    public ApplicationStatusHistoryService(
        JobApplicationRepository applicationRepository,
        ApplicationStatusEventRepository eventRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional(readOnly = true)
    public List<ApplicationStatusEventDTO> getHistory(UUID applicationId) throws ResourceNotFoundException {
        if (!applicationRepository.existsById(applicationId)) {
            throw new ResourceNotFoundException(applicationId + " not found.");
        }

        return eventRepository.findByApplicationIdOrderByOccurredAtAscIdAsc(applicationId)
            .stream()
            .map(event -> new ApplicationStatusEventDTO(
                event.getId(),
                applicationId,
                event.getPreviousStatus(),
                event.getNewStatus(),
                event.getOccurredAt()
            ))
            .toList();
    }
}
