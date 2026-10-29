package app.careerflow.rs.analytics.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO.Activity;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO.Coverage;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO.DailyActivity;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO.Definitions;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO.Duration;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO.Funnel;
import app.careerflow.rs.analytics.dto.AnalyticsProgressDTO.Period;
import app.careerflow.rs.common.exception.InvalidRequestException;

@Service
public class AnalyticsService {

    private static final String SUMMARY_SQL = """
        WITH initial_events AS (
            SELECT application_id, MIN(occurred_at) AS cohort_entry
            FROM application_status_events
            WHERE previous_status IS NULL
            GROUP BY application_id
        ),
        cohort AS (
            SELECT application_id, cohort_entry
            FROM initial_events
            WHERE (:hasStart = FALSE OR cohort_entry >= :rangeStart)
              AND cohort_entry < :rangeEnd
        ),
        stage_reach AS (
            SELECT c.application_id,
                   BOOL_OR(e.new_status = 'APPLIED') AS submitted,
                   BOOL_OR(e.new_status = 'INTERVIEWING') AS interviewing,
                   BOOL_OR(e.new_status = 'OFFER') AS offered
            FROM cohort c
            LEFT JOIN application_status_events e
              ON e.application_id = c.application_id
             AND e.occurred_at >= c.cohort_entry
             AND e.occurred_at < :rangeEnd
            GROUP BY c.application_id
        ),
        sequences AS (
            SELECT c.application_id,
                   EXTRACT(EPOCH FROM (target_event.occurred_at - applied_event.occurred_at)) / 3600.0
                       AS duration_hours
            FROM cohort c
            JOIN LATERAL (
                SELECT e.occurred_at, e.id
                FROM application_status_events e
                WHERE e.application_id = c.application_id
                  AND e.new_status = 'APPLIED'
                  AND e.occurred_at >= c.cohort_entry
                  AND e.occurred_at < :rangeEnd
                ORDER BY e.occurred_at, e.id
                LIMIT 1
            ) applied_event ON TRUE
            JOIN LATERAL (
                SELECT e.occurred_at
                FROM application_status_events e
                WHERE e.application_id = c.application_id
                  AND e.new_status IN ('INTERVIEWING', 'OFFER')
                  AND e.occurred_at < :rangeEnd
                  AND (e.occurred_at, e.id) > (applied_event.occurred_at, applied_event.id)
                ORDER BY e.occurred_at, e.id
                LIMIT 1
            ) target_event ON TRUE
        ),
        funnel AS (
            SELECT COUNT(*) AS cohort_count,
                   COUNT(*) FILTER (WHERE submitted) AS submitted_count,
                   COUNT(*) FILTER (WHERE interviewing) AS interviewing_count,
                   COUNT(*) FILTER (WHERE offered) AS offer_count,
                   COUNT(*) FILTER (WHERE submitted AND interviewing) AS submitted_interviewing_count,
                   COUNT(*) FILTER (WHERE submitted AND offered) AS submitted_offer_count
            FROM stage_reach
        ),
        coverage AS (
            SELECT COUNT(*) FILTER (WHERE ie.application_id IS NULL) AS legacy_count,
                   (SELECT MIN(cohort_entry) FROM initial_events) AS earliest_tracking
            FROM job_applications ja
            LEFT JOIN initial_events ie ON ie.application_id = ja.id
        ),
        activity AS (
            SELECT
                (SELECT COUNT(*) FROM job_applications ja
                 WHERE (:hasStart = FALSE OR ja.created_at >= :rangeStart)
                   AND ja.created_at < :rangeEnd) AS applications_created,
                (SELECT COUNT(*) FROM application_status_events e
                 WHERE e.new_status = 'APPLIED'
                   AND (:hasStart = FALSE OR e.occurred_at >= :rangeStart)
                   AND e.occurred_at < :rangeEnd) AS applied_events,
                (SELECT COUNT(*) FROM application_status_events e
                 WHERE e.previous_status IS NOT NULL
                   AND (:hasStart = FALSE OR e.occurred_at >= :rangeStart)
                   AND e.occurred_at < :rangeEnd) AS genuine_transitions
        ),
        duration_summary AS (
            SELECT COUNT(*) AS sample_count,
                   PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_hours) AS median_hours
            FROM sequences
        )
        SELECT f.cohort_count, f.submitted_count, f.interviewing_count, f.offer_count,
               f.submitted_interviewing_count, f.submitted_offer_count,
               CASE WHEN f.submitted_count = 0 THEN NULL
                    ELSE ROUND(f.submitted_interviewing_count::numeric / f.submitted_count, 4) END
                   AS interview_rate,
               CASE WHEN f.submitted_count = 0 THEN NULL
                    ELSE ROUND(f.submitted_offer_count::numeric / f.submitted_count, 4) END
                   AS offer_rate,
               c.legacy_count, c.earliest_tracking,
               a.applications_created, a.applied_events, a.genuine_transitions,
               d.sample_count, d.median_hours
        FROM funnel f CROSS JOIN coverage c CROSS JOIN activity a CROSS JOIN duration_summary d
        """;

    private static final String DAILY_SQL = """
        WITH application_daily AS (
            SELECT (created_at AT TIME ZONE 'UTC')::date AS day, COUNT(*) AS count
            FROM job_applications
            WHERE (:hasStart = FALSE OR created_at >= :rangeStart)
              AND created_at < :rangeEnd
            GROUP BY day
        ),
        applied_daily AS (
            SELECT (occurred_at AT TIME ZONE 'UTC')::date AS day, COUNT(*) AS count
            FROM application_status_events
            WHERE new_status = 'APPLIED'
              AND (:hasStart = FALSE OR occurred_at >= :rangeStart)
              AND occurred_at < :rangeEnd
            GROUP BY day
        ),
        transition_daily AS (
            SELECT (occurred_at AT TIME ZONE 'UTC')::date AS day, COUNT(*) AS count
            FROM application_status_events
            WHERE previous_status IS NOT NULL
              AND (:hasStart = FALSE OR occurred_at >= :rangeStart)
              AND occurred_at < :rangeEnd
            GROUP BY day
        ),
        active_days AS (
            SELECT day FROM application_daily
            UNION SELECT day FROM applied_daily
            UNION SELECT day FROM transition_daily
        )
        SELECT d.day,
               COALESCE(a.count, 0) AS applications_created,
               COALESCE(ap.count, 0) AS applied_events,
               COALESCE(t.count, 0) AS genuine_transitions
        FROM active_days d
        LEFT JOIN application_daily a ON a.day = d.day
        LEFT JOIN applied_daily ap ON ap.day = d.day
        LEFT JOIN transition_daily t ON t.day = d.day
        ORDER BY d.day
        """;

    private static final Definitions DEFINITIONS = new Definitions(
        "Applications whose initial event (previousStatus null) occurred in the requested UTC period.",
        "Explicit APPLIED, INTERVIEWING, and OFFER events from cohort entry through the period cutoff; preceding stages are never inferred.",
        "Decimal rates from 0 to 1. Both use submittedCount as denominator and include only submitted cohort members in their numerators; rates are null when submittedCount is zero.",
        "Applications use createdAt; applied events are explicit APPLIED events; genuine transitions require previousStatus non-null. Each is counted when it occurred in the requested UTC period.",
        "For submitted cohort applications, hours from the earliest APPLIED event to the earliest subsequent INTERVIEWING or OFFER event, using event time then ID ordering for ties.",
        "Sparse UTC calendar-day buckets: dates with no activity are omitted."
    );

    private final NamedParameterJdbcTemplate jdbc;

    public AnalyticsService(DataSource dataSource) {
        this.jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    @Transactional(readOnly = true)
    public AnalyticsProgressDTO getProgress(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidRequestException("from must be on or before to.");
        }

        Instant now = Instant.now();
        Instant start = toInstant(from, "from");
        Instant requestedEnd = to == null ? now : toInstant(nextDay(to), "to");
        Instant end = requestedEnd.isBefore(now) ? requestedEnd : now;

        MapSqlParameterSource parameters = new MapSqlParameterSource()
            .addValue("hasStart", start != null)
            .addValue("rangeStart", Timestamp.from(start == null ? Instant.EPOCH : start))
            .addValue("rangeEnd", Timestamp.from(end));

        Summary summary = jdbc.queryForObject(SUMMARY_SQL, parameters, this::mapSummary);
        List<DailyActivity> daily = jdbc.query(DAILY_SQL, parameters, this::mapDailyActivity);

        return new AnalyticsProgressDTO(
            new Period(from, to, "UTC", start, end),
            new Coverage(
                summary.cohortCount(),
                summary.legacyCount(),
                summary.earliestTrackingInstant()
            ),
            new Funnel(
                summary.submittedCount(),
                summary.interviewingCount(),
                summary.offerCount(),
                summary.submittedInterviewingCount(),
                summary.submittedOfferCount(),
                summary.interviewRate(),
                summary.offerRate()
            ),
            new Activity(
                summary.applicationsCreated(),
                summary.appliedEvents(),
                summary.genuineTransitions(),
                daily
            ),
            new Duration(summary.medianHours(), summary.sampleCount()),
            DEFINITIONS
        );
    }

    private Instant toInstant(LocalDate date, String parameter) {
        if (date == null) {
            return null;
        }
        try {
            return date.atStartOfDay(ZoneOffset.UTC).toInstant();
        } catch (DateTimeException ex) {
            throw new InvalidRequestException(parameter + " is outside the supported date range.");
        }
    }

    private LocalDate nextDay(LocalDate date) {
        try {
            return date.plusDays(1);
        } catch (DateTimeException ex) {
            throw new InvalidRequestException("to is outside the supported date range.");
        }
    }

    private Summary mapSummary(ResultSet result, int rowNumber) throws SQLException {
        Timestamp earliest = result.getTimestamp("earliest_tracking");
        double median = result.getDouble("median_hours");
        boolean medianWasNull = result.wasNull();
        return new Summary(
            result.getLong("cohort_count"),
            result.getLong("submitted_count"),
            result.getLong("interviewing_count"),
            result.getLong("offer_count"),
            result.getLong("submitted_interviewing_count"),
            result.getLong("submitted_offer_count"),
            result.getBigDecimal("interview_rate"),
            result.getBigDecimal("offer_rate"),
            result.getLong("legacy_count"),
            earliest == null ? null : earliest.toInstant(),
            result.getLong("applications_created"),
            result.getLong("applied_events"),
            result.getLong("genuine_transitions"),
            result.getLong("sample_count"),
            medianWasNull ? null : median
        );
    }

    private DailyActivity mapDailyActivity(ResultSet result, int rowNumber) throws SQLException {
        return new DailyActivity(
            result.getObject("day", LocalDate.class),
            result.getLong("applications_created"),
            result.getLong("applied_events"),
            result.getLong("genuine_transitions")
        );
    }

    private record Summary(
        long cohortCount,
        long submittedCount,
        long interviewingCount,
        long offerCount,
        long submittedInterviewingCount,
        long submittedOfferCount,
        java.math.BigDecimal interviewRate,
        java.math.BigDecimal offerRate,
        long legacyCount,
        Instant earliestTrackingInstant,
        long applicationsCreated,
        long appliedEvents,
        long genuineTransitions,
        long sampleCount,
        Double medianHours
    ) {}
}
