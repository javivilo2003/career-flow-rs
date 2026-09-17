package app.careerflow.rs.job_application.mapper;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.dto.JobApplicationDTO;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.user.domain.User;

import static org.assertj.core.api.Assertions.assertThat;

class JobApplicationDTOMapperTest {

    private JobApplicationMapper mapper = new JobApplicationMapper();
    
    @Test
    void mapsEntityToDto() {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        LocalDate appliedAt = LocalDate.of(2026, 8, 28);

        Company company = Company.builder()
            .id(companyId)
            .companyName("OpenAI")
            .build();
        
        User user = User.builder()
            .id(userId)
            .username("testing")
            .build();

        JobApplication application = JobApplication.builder()
            .id(applicationId)
            .user(user)
            .company(company)
            .position("Backend Engineer")
            .jobType("Full-time")
            .description("Java/Spring role")
            .salary(120000)
            .status(ApplicationStatus.APPLIED)
            .appliedAt(appliedAt)
            .source("LinkedIn")
            .postingLink("https://example.com/jobs/123")
            .build();

        JobApplicationDTO dto = mapper.apply(application);

        assertThat(dto.id()).isEqualTo(applicationId);
        assertThat(dto.userId()).isEqualTo(userId);
        assertThat(dto.companyId()).isEqualTo(companyId);
        assertThat(dto.position()).isEqualTo("Backend Engineer");
        assertThat(dto.jobType()).isEqualTo("Full-time");
        assertThat(dto.description()).isEqualTo("Java/Spring role");
        assertThat(dto.salary()).isEqualTo(120000);
        assertThat(dto.status()).isEqualTo(ApplicationStatus.APPLIED);
        assertThat(dto.appliedAt()).isEqualTo(appliedAt);
        assertThat(dto.source()).isEqualTo("LinkedIn");
        assertThat(dto.postingLink()).isEqualTo("https://example.com/jobs/123");
    }

    @Test
    void mapsRequestToEntity(){
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        LocalDate appliedAt = LocalDate.of(2026, 8, 28);

        Company company = Company.builder()
            .id(companyId)
            .companyName("OpenAI")
            .build();

        User user = User.builder()
            .id(userId)
            .username("testing")
            .build();

        JobApplicationRequest request = new JobApplicationRequest(
            userId,
            companyId,
            "Backend Engineer",
            "Full-time",
            "Java/Spring role",
            120000,
            ApplicationStatus.APPLIED,
            appliedAt,
            "LinkedIn",
            "https://example.com/jobs/123"
        );

        JobApplication entity = mapper.toEntity(request, company, user);

        assertThat(entity.getId()).isNull();
        assertThat(entity.getUser()).isEqualTo(user);
        assertThat(entity.getCompany()).isSameAs(company);
        assertThat(entity.getPosition()).isEqualTo("Backend Engineer");
        assertThat(entity.getJobType()).isEqualTo("Full-time");
        assertThat(entity.getDescription()).isEqualTo("Java/Spring role");
        assertThat(entity.getSalary()).isEqualTo(120000);
        assertThat(entity.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
        assertThat(entity.getAppliedAt()).isEqualTo(appliedAt);
        assertThat(entity.getSource()).isEqualTo("LinkedIn");
        assertThat(entity.getPostingLink()).isEqualTo("https://example.com/jobs/123");
    }
}
