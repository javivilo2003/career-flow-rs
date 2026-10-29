package app.careerflow.rs.phase4;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
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
import app.careerflow.rs.followup.domain.FollowUp;
import app.careerflow.rs.followup.mapper.FollowUpMapper;
import app.careerflow.rs.followup.repository.FollowUpRepository;
import app.careerflow.rs.followup.service.FollowUpFilter;
import app.careerflow.rs.followup.service.FollowUpService;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;

@DataJpaTest
@ActiveProfiles("test")
@Import({
    TestcontainersConfiguration.class,
    FollowUpService.class,
    FollowUpMapper.class
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PhaseFourFollowUpQueryIntegrationTest {

    private static final LocalDate RANGE_START = LocalDate.of(2026, 10, 27);
    private static final LocalDate RANGE_END = LocalDate.of(2026, 10, 31);

    @Autowired private CompanyRepository companyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JobApplicationRepository applicationRepository;
    @Autowired private FollowUpRepository followUpRepository;
    @Autowired private FollowUpService followUpService;

    private JobApplication firstApplication;
    private JobApplication secondApplication;

    @BeforeEach
    void setUp() {
        Company company = companyRepository.save(Company.builder()
            .companyName("Phase Four " + UUID.randomUUID())
            .build());
        User owner = userRepository.save(User.builder()
            .username("p4-owner-" + UUID.randomUUID().toString().substring(0, 8))
            .build());
        firstApplication = saveApplication(owner, company, "Platform Engineer");
        secondApplication = saveApplication(owner, company, "Product Engineer");
    }

    @Test
    void combinesAssociationPendingStateAndInclusiveDateBoundaries() {
        FollowUp startBoundary = saveFollowUp(firstApplication, "Start boundary", RANGE_START, false);
        FollowUp endBoundary = saveFollowUp(firstApplication, "End boundary", RANGE_END, false);
        saveFollowUp(firstApplication, "Before range", RANGE_START.minusDays(1), false);
        saveFollowUp(firstApplication, "After range", RANGE_END.plusDays(1), false);
        saveFollowUp(firstApplication, "Completed boundary", RANGE_START, true);
        saveFollowUp(secondApplication, "Other application", RANGE_START, false);

        var result = followUpService.getFollowUps(
            new FollowUpFilter(
                null,
                firstApplication.getId(),
                null,
                false,
                RANGE_START,
                RANGE_END
            ),
            0,
            10,
            "dueDate",
            Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .extracting(dto -> dto.id())
            .containsExactly(startBoundary.getId(), endBoundary.getId());
        assertThat(result.getContent())
            .allSatisfy(dto -> {
                assertThat(dto.applicationId()).isEqualTo(firstApplication.getId());
                assertThat(dto.completed()).isFalse();
                assertThat(dto.dueDate()).isBetween(RANGE_START, RANGE_END);
            });
    }

    @Test
    void completedFilterReturnsOnlyCompletedFollowUps() {
        FollowUp completed = saveFollowUp(firstApplication, "Completed", RANGE_START, true);
        saveFollowUp(firstApplication, "Pending", RANGE_START, false);

        var result = followUpService.getFollowUps(
            new FollowUpFilter(null, firstApplication.getId(), null, true, null, null),
            0,
            10,
            "dueDate",
            Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .singleElement()
            .satisfies(dto -> {
                assertThat(dto.id()).isEqualTo(completed.getId());
                assertThat(dto.applicationId()).isEqualTo(firstApplication.getId());
                assertThat(dto.completed()).isTrue();
            });
    }

    private JobApplication saveApplication(User owner, Company company, String position) {
        return applicationRepository.save(JobApplication.builder()
            .user(owner)
            .company(company)
            .position(position)
            .status(ApplicationStatus.APPLIED)
            .source("QA")
            .build());
    }

    private FollowUp saveFollowUp(
            JobApplication application, String title, LocalDate dueDate, boolean completed) {
        return followUpRepository.save(FollowUp.builder()
            .application(application)
            .title(title)
            .dueDate(dueDate)
            .completed(completed)
            .build());
    }
}
