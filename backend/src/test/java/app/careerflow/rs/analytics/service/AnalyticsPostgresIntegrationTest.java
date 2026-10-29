package app.careerflow.rs.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import app.careerflow.rs.TestcontainersConfiguration;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO;
import app.careerflow.rs.common.exception.InvalidRequestException;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@Transactional
class AnalyticsPostgresIntegrationTest {

    private static final LocalDate FROM = LocalDate.of(2026, 8, 10);
    private static final LocalDate TO = LocalDate.of(2026, 8, 14);

    @Autowired private AnalyticsService service;
    @Autowired private JdbcTemplate jdbc;

    private UUID userId;
    private UUID companyId;
    private long baselineLegacy;

    @BeforeEach
    void setUp() {
        userId = jdbc.queryForObject("select id from users order by id limit 1", UUID.class);
        companyId = jdbc.queryForObject("select id from companies order by id limit 1", UUID.class);
        baselineLegacy = service.getProgress(null, null).coverage().legacyApplicationCount();
    }

    @Test
    void computesOnlyExplicitEventsForInstrumentedCohortRatesActivityAndDurations() {
        UUID offerOnly = application("Offer does not imply stages", "2026-08-10T00:00:00Z");
        event(offerOnly, null, "SAVED", "2026-08-10T00:00:00Z");
        event(offerOnly, "SAVED", "OFFER", "2026-08-11T02:00:00Z");

        UUID interviewed = application("Interviewed", "2026-08-10T00:30:00Z");
        event(interviewed, null, "APPLIED", "2026-08-10T01:00:00Z");
        event(interviewed, "APPLIED", "INTERVIEWING", "2026-08-10T06:00:00Z");

        UUID submittedOffer = application("Submitted offer", "2026-08-11T00:00:00Z");
        event(submittedOffer, null, "SAVED", "2026-08-11T00:00:00Z");
        event(submittedOffer, "SAVED", "APPLIED", "2026-08-11T03:00:00Z");
        event(submittedOffer, "APPLIED", "APPLIED", "2026-08-11T05:00:00Z");
        event(submittedOffer, "APPLIED", "OFFER", "2026-08-11T12:00:00Z");

        UUID legacy = application("Legacy no initial history", "2026-08-12T00:00:00Z");
        event(legacy, "SAVED", "APPLIED", "2026-08-12T04:00:00Z");

        AnalyticsProgressDTO result = service.getProgress(FROM, TO);

        assertThat(result.period().startInclusive()).isEqualTo(Instant.parse("2026-08-10T00:00:00Z"));
        assertThat(result.period().endExclusive()).isEqualTo(Instant.parse("2026-08-15T00:00:00Z"));
        assertThat(result.coverage().instrumentedCohortCount()).isEqualTo(3);
        assertThat(result.coverage().legacyApplicationCount()).isEqualTo(baselineLegacy + 1);
        assertThat(result.coverage().earliestTrackingInstant()).isNotNull();

        assertThat(result.funnel().submittedCount()).isEqualTo(2);
        assertThat(result.funnel().interviewingCount()).isEqualTo(1);
        assertThat(result.funnel().offerCount()).isEqualTo(2);
        assertThat(result.funnel().interviewReachAmongSubmittedCount()).isEqualTo(1);
        assertThat(result.funnel().offerAmongSubmittedCount()).isEqualTo(1);
        assertThat(result.funnel().interviewReachRate()).isEqualByComparingTo(new BigDecimal("0.5000"));
        assertThat(result.funnel().offerRate()).isEqualByComparingTo(new BigDecimal("0.5000"));

        assertThat(result.activity().applicationsCreated()).isEqualTo(4);
        assertThat(result.activity().appliedEvents()).isEqualTo(4);
        assertThat(result.activity().genuineTransitions()).isEqualTo(6);
        assertThat(result.activity().daily()).extracting(AnalyticsProgressDTO.DailyActivity::date)
            .containsExactly(LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 11),
                LocalDate.of(2026, 8, 12));
        assertThat(result.activity().daily()).noneMatch(day -> day.date().equals(LocalDate.of(2026, 8, 13)));

        assertThat(result.duration().sampleCount()).isEqualTo(2);
        assertThat(result.duration().medianSubmittedToInterviewOrOfferHours()).isEqualTo(7.0);
    }

    @Test
    void usesInclusiveUtcDatesExcludesNextMidnightAndReturnsNullRatesAndDurationHonestly() {
        UUID included = application("At inclusive start", "2026-08-10T00:00:00Z");
        event(included, null, "OFFER", "2026-08-10T00:00:00Z");
        UUID excluded = application("At exclusive midnight", "2026-08-15T00:00:00Z");
        event(excluded, null, "APPLIED", "2026-08-15T00:00:00Z");

        AnalyticsProgressDTO result = service.getProgress(FROM, TO);

        assertThat(result.coverage().instrumentedCohortCount()).isEqualTo(1);
        assertThat(result.funnel().offerCount()).isEqualTo(1);
        assertThat(result.funnel().submittedCount()).isZero();
        assertThat(result.funnel().interviewReachRate()).isNull();
        assertThat(result.funnel().offerRate()).isNull();
        assertThat(result.duration().sampleCount()).isZero();
        assertThat(result.duration().medianSubmittedToInterviewOrOfferHours()).isNull();
        assertThat(result.activity().applicationsCreated()).isEqualTo(1);
        assertThat(result.activity().appliedEvents()).isZero();
    }

    @Test
    void rejectsReversedRangeBeforeQuerying() {
        assertThatThrownBy(() -> service.getProgress(TO, FROM))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("from must be on or before to.");
    }

    @Test
    void v5IndexesExistAndSupportAnalyticsPredicates() {
        List<String> definitions = jdbc.queryForList("""
            select indexdef from pg_indexes where schemaname = 'public' and indexname in (
              'application_status_events_initial_time_application_idx',
              'application_status_events_transition_time_idx',
              'job_applications_created_at_idx') order by indexname
            """, String.class);
        assertThat(definitions).hasSize(3);
        assertThat(definitions).anyMatch(value -> value.contains("WHERE (previous_status IS NULL)"));
        assertThat(definitions).anyMatch(value -> value.contains("WHERE (previous_status IS NOT NULL)"));
        assertThat(definitions).anyMatch(value -> value.contains("job_applications") && value.contains("created_at"));

        jdbc.execute("set local enable_seqscan = off");
        assertPlanUses("select application_id from application_status_events where previous_status is null and occurred_at >= timestamptz '2026-01-01'",
            "application_status_events_initial_time_application_idx");
        assertPlanUses("select occurred_at from application_status_events where previous_status is not null and occurred_at >= timestamptz '2026-01-01'",
            "application_status_events_transition_time_idx");
        assertPlanUses("select created_at from job_applications where created_at >= timestamptz '2026-01-01'",
            "job_applications_created_at_idx");
    }

    private UUID application(String position, String createdAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
            insert into job_applications
              (id, user_id, company_id, position, job_type, status, source, created_at, version)
            values (?, ?, ?, ?, null, 'SAVED', 'QA', ?::timestamptz, 0)
            """, id, userId, companyId, position, createdAt);
        return id;
    }

    private void event(UUID applicationId, String previous, String next, String occurredAt) {
        jdbc.update("""
            insert into application_status_events
              (id, application_id, previous_status, new_status, occurred_at)
            values (?, ?, ?::application_status, ?::application_status, ?::timestamptz)
            """, UUID.randomUUID(), applicationId, previous, next, occurredAt);
    }

    private void assertPlanUses(String query, String index) {
        String plan = String.join("\n", jdbc.queryForList("explain " + query, String.class));
        assertThat(plan).contains(index);
    }
}
