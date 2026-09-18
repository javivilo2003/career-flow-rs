package app.careerflow.rs.company.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.careerflow.rs.company.dto.CompanyDTO;
import app.careerflow.rs.company.dto.CompanyRequest;
import app.careerflow.rs.company.service.CompanyFilter;
import app.careerflow.rs.company.service.CompanyService;
import app.careerflow.rs.common.exception.ConflictException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PutMapping;





@RestController
@RequestMapping("/api/companies")
public class CompanyController {
    
    private CompanyService service;

    public CompanyController(CompanyService service) {
        this.service = service;
    }

    @GetMapping()
    public Page<CompanyDTO> getAllCompanies(
        @ModelAttribute CompanyFilter filter,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "createdAt") String sort,
        @RequestParam(defaultValue = "DESC") Direction direction
    ) {
        return service.getCompanies(filter, page, size, sort, direction);
    }
    
    @GetMapping("{id}")
    public CompanyDTO getCompanyById(@PathVariable UUID id) throws Exception{
        return service.getCompanyById(id);
    }

    @PostMapping()
    public void createNewCompany(@Valid @RequestBody CompanyRequest request){
        service.addNewCompany(request);
    }

    @ResponseStatus(HttpStatus.OK)
    @PutMapping("{id}")
    public CompanyDTO updateCompany(
        @PathVariable UUID id,
        @Valid @RequestBody CompanyRequest request
    ) throws ResourceNotFoundException {
        return service.updateCompany(id, request);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("{id}")
    public void deleteCompany(@PathVariable UUID id) throws ResourceNotFoundException, ConflictException {
        service.deleteById(id);
    }

}
