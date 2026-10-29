package app.careerflow.rs.job_application.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import app.careerflow.rs.TestcontainersConfiguration;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.mapper.JobApplicationMapper;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;

@DataJpaTest
@ActiveProfiles("test")
@Import({
    TestcontainersConfiguration.class,
    JobApplicationService.class,
    JobApplicationMapper.class
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JobApplicationPhaseTwoQueryIntegrationTest {

    @Autowired private JobApplicationService service;
    @Autowired private JobApplicationRepository applicationRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private UserRepository userRepository;

    private Company alphaCompany;
    private Company betaCompany;
    private User owner;

    @BeforeEach
    void setUp() {
        alphaCompany = companyRepository.save(Company.builder()
            .companyName("Alpha Phase Two " + UUID.randomUUID())
            .build());
        betaCompany = companyRepository.save(Company.builder()
            .companyName("Beta Phase Two " + UUID.randomUUID())
            .build());
        owner = userRepository.save(User.builder()
            .username("p2-owner-" + UUID.randomUUID().toString().substring(0, 8))
            .build());
    }

    @Test
    void combinesCompanyStatusAndPositionFiltersWithServerSidePagination() {
        save(alphaCompany, "Platform Engineer", ApplicationStatus.APPLIED, 100_000);
        save(alphaCompany, "Principal Platform Engineer", ApplicationStatus.APPLIED, 120_000);
        save(alphaCompany, "Platform Engineer", ApplicationStatus.SAVED, 80_000);
        save(betaCompany, "Platform Engineer", ApplicationStatus.APPLIED, 90_000);

        JobApplicationFilter filter = new JobApplicationFilter(
            null,
            null,
            alphaCompany.getId(),
            "platform",
            null,
            null,
            null,
            ApplicationStatus.APPLIED,
            null,
            null,
            null
        );

        var firstPage = service.getJobApplications(
            filter, 0, 1, "salary", Sort.Direction.ASC
        );
        var secondPage = service.getJobApplications(
            filter, 1, 1, "salary", Sort.Direction.ASC
        );

        assertThat(firstPage.getTotalElements()).isEqualTo(2);
        assertThat(firstPage.getTotalPages()).isEqualTo(2);
        assertThat(firstPage.getNumber()).isZero();
        assertThat(firstPage.getSize()).isEqualTo(1);
        assertThat(firstPage.getContent())
            .extracting(dto -> dto.position())
            .containsExactly("Platform Engineer");
        assertThat(secondPage.getNumber()).isEqualTo(1);
        assertThat(secondPage.getContent())
            .extracting(dto -> dto.position())
            .containsExactly("Principal Platform Engineer");
    }

    @Test
    void positionSearchIsTrimmedCaseInsensitiveAndPartial() {
        save(alphaCompany, "Senior Backend Engineer", ApplicationStatus.APPLIED, 100_000);
        save(alphaCompany, "Product Designer", ApplicationStatus.APPLIED, 90_000);

        var result = service.getJobApplications(
            positionFilter("  BACKEND eng  "),
            0,
            10,
            "position",
            Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .extracting(dto -> dto.position())
            .containsExactly("Senior Backend Engineer");
    }

    @Test
    void percentInPositionSearchIsTreatedAsLiteralTextNotSqlWildcard() {
        save(alphaCompany, "100% Remote Engineer", ApplicationStatus.APPLIED, 100_000);
        save(alphaCompany, "1000 Remote Engineer", ApplicationStatus.APPLIED, 90_000);

        var result = service.getJobApplications(
            positionFilter("100% Remote"),
            0,
            10,
            "position",
            Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .extracting(dto -> dto.position())
            .containsExactly("100% Remote Engineer");
    }

    @Test
    void underscoreInPositionSearchIsTreatedAsLiteralTextNotSqlWildcard() {
        save(alphaCompany, "Data_Engineer", ApplicationStatus.APPLIED, 100_000);
        save(alphaCompany, "DataXEngineer", ApplicationStatus.APPLIED, 90_000);

        var result = service.getJobApplications(
            positionFilter("Data_Engineer"),
            0,
            10,
            "position",
            Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .extracting(dto -> dto.position())
            .containsExactly("Data_Engineer");
    }

    @Test
    void companyNameSortUsesTheRelatedCompanyName() {
        save(betaCompany, "Same Position", ApplicationStatus.APPLIED, 90_000);
        save(alphaCompany, "Same Position", ApplicationStatus.APPLIED, 90_000);

        var result = service.getJobApplications(
            emptyFilter(), 0, 10, "companyName", Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .extracting(dto -> dto.companyId())
            .containsSubsequence(alphaCompany.getId(), betaCompany.getId());
    }

    private void save(
            Company company, String position, ApplicationStatus status, Integer salary) {
        applicationRepository.save(JobApplication.builder()
            .user(owner)
            .company(company)
            .position(position)
            .salary(salary)
            .status(status)
            .source("QA")
            .build());
    }

    private JobApplicationFilter positionFilter(String position) {
        return new JobApplicationFilter(
            null, null, null, position, null, null, null, null, null, null, null
        );
    }

    private JobApplicationFilter emptyFilter() {
        return new JobApplicationFilter(
            null, null, null, null, null, null, null, null, null, null, null
        );
    }
}
