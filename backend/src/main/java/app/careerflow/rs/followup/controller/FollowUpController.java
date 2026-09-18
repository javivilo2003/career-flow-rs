package app.careerflow.rs.followup.controller;

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

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.followup.dto.FollowUpDTO;
import app.careerflow.rs.followup.dto.FollowUpRequest;
import app.careerflow.rs.followup.service.FollowUpFilter;
import app.careerflow.rs.followup.service.FollowUpService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.PutMapping;


@RestController
@RequestMapping("/api/followups")
public class FollowUpController {
    
    private final FollowUpService service;

    public FollowUpController(FollowUpService service) {
        this.service = service;
    }

    @GetMapping()
    public Page<FollowUpDTO> getAllFollowUps(
        @ModelAttribute FollowUpFilter filter,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "dueDate") String sort,
        @RequestParam(defaultValue = "ASC") Sort.Direction direction
    ) {
        return service.getFollowUps(filter, page, size, sort, direction);
    }

    @GetMapping("{id}")
    public FollowUpDTO getFollowUpById(@PathVariable UUID id) throws ResourceNotFoundException{
        return service.getFollowUpById(id);
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping()
    public void addNewFollowUp(@Valid @RequestBody FollowUpRequest request) throws ResourceNotFoundException{
        service.addNewFollowUp(request);
    }

    @ResponseStatus(HttpStatus.OK)
    @PutMapping("{id}")
    public FollowUpDTO updateFollowUpByIDto(@PathVariable UUID id, @Valid @RequestBody FollowUpRequest request) throws ResourceNotFoundException{
        return service.updateFollowUpById(id, request);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("{id}")
    public void deleteFollowUpById(@PathVariable UUID id) throws ResourceNotFoundException{
        service.deleteFollowUpById(id);
    } 
}
