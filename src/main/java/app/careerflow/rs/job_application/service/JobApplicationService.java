package app.careerflow.rs.job_application.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.StreamSupport;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.mapper.JobApplicationDTOMapper;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;

@Service
public class JobApplicationService {
    
    private final JobApplicationRepository repository;
    private final JobApplicationDTOMapper mapper;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public JobApplicationService(JobApplicationRepository repository, JobApplicationDTOMapper mapper, CompanyRepository companyRepository, UserRepository userRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    public List<JobApplicationDTO> getAllJobApplications(){
        return StreamSupport.stream(repository.findAll().spliterator(), false)
            .map(mapper)
            .toList();
    }

    public List<JobApplicationDTO> getAllJobApplicationsSortedBy(String field){
        return StreamSupport.stream(repository.findAll(Sort.by(Sort.Direction.ASC, field)).spliterator(), false)
            .map(mapper)
            .toList();
    }

    public Page<JobApplicationDTO> getJobApplicationsPagedAndSortedBy(int pageNumber, int pageSize, String field){
        return repository.findAll(PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.ASC, field))).map(mapper);
    }

    public Page<JobApplicationDTO> getJobApplicationsByStatus(ApplicationStatus status, int pageNumber, int pageSize){

        String sort =  "appliedAt";
        PageRequest pageable = PageRequest.of(pageNumber, pageSize, Sort.by(sort));

        return repository.findByStatus(status, pageable).map(mapper);

    }

    public JobApplicationDTO getJobApplicationById(UUID id) throws Exception{
        return repository.findById(id)
            .map(mapper)    
            .orElseThrow(() -> new ResourceNotFoundException(id + " not found."));
    }

    public void addNewJobApplication(JobApplicationRequest request) throws Exception{
        Company company = companyRepository.findById(request.companyId())
            .orElseThrow(() -> new ResourceNotFoundException(request.companyId() + " not found."));

        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new ResourceNotFoundException(request.userId() + " not found."));

        JobApplication application = mapper.toEntity(request, company, user);

        repository.save(application);
    }
}
