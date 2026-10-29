package app.careerflow.rs.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AnalyticsProgressDTO(
    Period period,
    Coverage coverage,
    Funnel funnel,
    Activity activity,
    Duration duration,
    Definitions definitions
) {

    public record Period(
        LocalDate from,
        LocalDate to,
        String timezone,
        Instant startInclusive,
        Instant endExclusive
    ) {}

    public record Coverage(
        long instrumentedCohortCount,
        long legacyApplicationCount,
        Instant earliestTrackingInstant
    ) {}

    public record Funnel(
        long submittedCount,
        long interviewingCount,
        long offerCount,
        long interviewReachAmongSubmittedCount,
        long offerAmongSubmittedCount,
        BigDecimal interviewReachRate,
        BigDecimal offerRate
    ) {}

    public record Activity(
        long applicationsCreated,
        long appliedEvents,
        long genuineTransitions,
        List<DailyActivity> daily
    ) {}

    public record DailyActivity(
        LocalDate date,
        long applicationsCreated,
        long appliedEvents,
        long genuineTransitions
    ) {}

    public record Duration(
        Double medianSubmittedToInterviewOrOfferHours,
        long sampleCount
    ) {}

    public record Definitions(
        String cohort,
        String stageReach,
        String rates,
        String activity,
        String duration,
        String dailyBuckets
    ) {}
}
