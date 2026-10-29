package app.careerflow.rs.job_application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import app.careerflow.rs.TestcontainersConfiguration;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.dto.JobApplicationRequest;
import app.careerflow.rs.job_application.repository.ApplicationStatusEventRepository;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;
import jakarta.persistence.EntityManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ApplicationTimelinePostgresIntegrationTest {

    @Autowired private JobApplicationService applicationService;
    @Autowired private ApplicationStatusHistoryService historyService;
    @Autowired private JobApplicationRepository applicationRepository;
    @Autowired private ApplicationStatusEventRepository eventRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;

    private UUID companyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        Company company = companyRepository.save(Company.builder()
            .companyName("Timeline QA " + UUID.randomUUID())
            .build());
        User user = userRepository.save(User.builder()
            .username("tl-" + UUID.randomUUID().toString().substring(0, 12))
            .build());
        companyId = company.getId();
        userId = user.getId();
    }

    @Test
    void migrationUsesInstantColumnsCascadeAndDoesNotFabricateLegacyHistory() throws Exception {
        assertThat(columnType("job_applications", "created_at"))
            .isEqualTo("timestamp with time zone");
        assertThat(columnType("job_applications", "updated_at"))
            .isEqualTo("timestamp with time zone");
        assertThat(columnType("application_status_events", "occurred_at"))
            .isEqualTo("timestamp with time zone");

        UUID legacyApplicationId = jdbcTemplate.queryForObject(
            "select id from job_applications where position = ?",
            UUID.class,
            "Software Engineer, Infrastructure - DGX Cloud"
        );
        assertThat(historyService.getHistory(legacyApplicationId)).isEmpty();

        String deleteRule = jdbcTemplate.queryForObject("""
            select rc.delete_rule
              from information_schema.referential_constraints rc
             where rc.constraint_name = 'application_status_events_application_fk'
            """, String.class);
        assertThat(deleteRule).isEqualTo("CASCADE");
    }

    @Test
    void createProducesOneInitialEventAndInstantResponseTimestamps() throws Exception {
        var created = applicationService.addNewJobApplication(
            request(ApplicationStatus.SAVED, "Timeline Engineer")
        );

        assertThat(created.createdAt()).isNotNull();
        assertThat(created.updatedAt()).isNull();
        assertThat(historyService.getHistory(created.id())).singleElement().satisfies(event -> {
            assertThat(event.id()).isNotNull();
            assertThat(event.applicationId()).isEqualTo(created.id());
            assertThat(event.previousStatus()).isNull();
            assertThat(event.newStatus()).isEqualTo(ApplicationStatus.SAVED);
            assertThat(event.occurredAt()).isNotNull();
        });
    }

    @Test
    void onlyRealStatusChangesAppendExactlyOneChronologicalEvent() throws Exception {
        var created = applicationService.addNewJobApplication(
            request(ApplicationStatus.SAVED, "Original Position")
        );

        applicationService.updateJobApplication(
            created.id(), request(ApplicationStatus.SAVED, "Renamed Position")
        );
        applicationService.updateJobApplication(
            created.id(), request(ApplicationStatus.APPLIED, "Renamed Position")
        );
        applicationService.updateJobApplication(
            created.id(), request(ApplicationStatus.APPLIED, "Renamed Again")
        );

        var history = historyService.getHistory(created.id());
        assertThat(history).hasSize(2);
        assertThat(history).extracting(event -> event.newStatus())
            .containsExactly(ApplicationStatus.SAVED, ApplicationStatus.APPLIED);
        assertThat(history.get(1).previousStatus()).isEqualTo(ApplicationStatus.SAVED);
        assertThat(history.get(0).occurredAt()).isBeforeOrEqualTo(history.get(1).occurredAt());
    }

    @Test
    void failedStatusUpdateRollsBackApplicationAndHistoryTogether() throws Exception {
        var created = applicationService.addNewJobApplication(
            request(ApplicationStatus.SAVED, "Rollback Position")
        );
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);

        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored ->
            updateUnchecked(created.id(), request(ApplicationStatus.APPLIED, null))
        )).isInstanceOf(RuntimeException.class);

        entityManager.clear();
        assertThat(applicationRepository.findById(created.id()).orElseThrow().getStatus())
            .isEqualTo(ApplicationStatus.SAVED);
        assertThat(historyService.getHistory(created.id()))
            .extracting(event -> event.newStatus())
            .containsExactly(ApplicationStatus.SAVED);
    }

    @Test
    void deletingEligibleApplicationCascadesItsHistory() throws Exception {
        var created = applicationService.addNewJobApplication(
            request(ApplicationStatus.SAVED, "Delete Position")
        );
        assertThat(eventRepository.findByApplicationIdOrderByOccurredAtAscIdAsc(created.id()))
            .hasSize(1);

        applicationService.deleteApplicationById(created.id());

        assertThat(applicationRepository.existsById(created.id())).isFalse();
        assertThat(eventRepository.findByApplicationIdOrderByOccurredAtAscIdAsc(created.id()))
            .isEmpty();
    }

    private JobApplicationRequest request(ApplicationStatus status, String position) {
        return new JobApplicationRequest(
            userId, companyId, position, null, null, null, status, null, "QA", null
        );
    }

    private void updateUnchecked(UUID applicationId, JobApplicationRequest request) {
        try {
            applicationService.updateJobApplication(applicationId, request);
        } catch (Exception exception) {
            throw new RuntimeException(exception);
        }
    }

    private String columnType(String table, String column) {
        return jdbcTemplate.queryForObject("""
            select data_type
              from information_schema.columns
             where table_schema = 'public' and table_name = ? and column_name = ?
            """, String.class, table, column);
    }
}
