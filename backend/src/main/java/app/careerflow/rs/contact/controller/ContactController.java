package app.careerflow.rs.contact.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.contact.dto.ContactDTO;
import app.careerflow.rs.contact.dto.ContactRequest;
import app.careerflow.rs.contact.service.ContactFilter;
import app.careerflow.rs.contact.service.ContactService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    
    private final ContactService service;

    public ContactController(ContactService service) {
        this.service = service;
    }

    @GetMapping()
    public Page<ContactDTO> getAllContacts(
        @ModelAttribute ContactFilter filter,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "name") String sort,
        @RequestParam(defaultValue = "ASC") Sort.Direction direction
    ) {
        return service.getContacts(filter, page, size, sort, direction);
    }

    @GetMapping("{id}")
    public ContactDTO getContactById(@PathVariable UUID id) throws ResourceNotFoundException {
        return service.getContactById(id);
    }

    @PostMapping
    public void addNewContact(@Valid @RequestBody ContactRequest request)throws ResourceNotFoundException{
        service.addNewContact(request);
    }

}
