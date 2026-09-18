package app.careerflow.rs.job_application.mapper;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.user.domain.User;

@Service
public class JobApplicationMapper implements Function<JobApplication, JobApplicationDTO>{

    @Override
    public JobApplicationDTO apply(JobApplication t) {
        return new JobApplicationDTO(
            t.getId(),
            t.getUser().getId(),
            t.getCompany().getId(),
            t.getPosition(),
            t.getJobType(),
            t.getDescription(),
            t.getSalary(),
            t.getStatus(),
            t.getAppliedAt(),
            t.getSource(),
            t.getPostingLink()
        );
    }

    public JobApplication toEntity(JobApplicationRequest request, Company company, User user) {
    return JobApplication.builder()
        .user(user)
        .company(company)
        .position(request.position())
        .jobType(request.jobType())
        .description(request.description())
        .salary(request.salary())
        .status(request.status())
        .appliedAt(request.appliedAt())
        .source(request.source())
        .postingLink(request.postingLink())
        .build();
}
    
}
