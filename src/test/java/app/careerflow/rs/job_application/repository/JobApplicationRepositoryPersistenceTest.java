package app.careerflow.rs.job_application.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.SQLException;
import java.time.LocalDate;

import app.careerflow.rs.TestcontainersConfiguration;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JobApplicationRepositoryPersistenceTest {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void savesAndLoadsCompanyRelationship() {
        Company company = companyRepository.save(Company.builder()
            .companyName("Persistence Test Company")
            .build());
        User user = userRepository.save(User.builder()
            .username("persistence-test-user")
            .build());
        JobApplication savedApplication = jobApplicationRepository.saveAndFlush(
            JobApplication.builder()
                .user(user)
                .company(company)
                .position("Backend Developer")
                .jobType("Full-time")
                .status(ApplicationStatus.APPLIED)
                .appliedAt(LocalDate.of(2026, 9, 15))
                .source("Company website")
                .build()
        );

        entityManager.clear();

        JobApplication loadedApplication = jobApplicationRepository
            .findById(savedApplication.getId())
            .orElseThrow();

        assertThat(loadedApplication.getCompany().getId()).isEqualTo(company.getId());
        assertThat(loadedApplication.getCompany().getCompanyName())
            .isEqualTo("Persistence Test Company");
    }

    @Test
    void databaseRejectsApplicationStatusOutsideAllowedValues() {
        Company company = companyRepository.save(Company.builder()
            .companyName("Constraint Test Company")
            .build());
        User user = userRepository.save(User.builder()
            .username("constraint-test-user")
            .build());
        entityManager.flush();

        DataAccessException exception = assertThrows(DataAccessException.class, () ->
            jdbcTemplate.update("""
                INSERT INTO job_applications
                    (user_id, company_id, position, job_type, status, source)
                VALUES (?, ?, ?, ?, 'NOT_A_STATUS', ?)
                """,
                user.getId(), company.getId(), "Platform Engineer", "Full-time", "Referral")
        );

        assertThat(exception.getMostSpecificCause()).isInstanceOf(SQLException.class);
        SQLException sqlException = (SQLException) exception.getMostSpecificCause();
        assertThat(sqlException.getSQLState()).isEqualTo("22P02");
    }
}
