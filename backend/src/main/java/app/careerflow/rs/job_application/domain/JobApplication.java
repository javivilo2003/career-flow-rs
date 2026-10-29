package app.careerflow.rs.job_application.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name="job_applications")
public class JobApplication {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    @NotNull
    private Company company;

    @NotNull
    private String position;

    private String jobType;

    private String description;

    private Integer salary;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @NotNull
    private ApplicationStatus status;

    private LocalDate appliedAt;

    @NotNull
    private String source;

    private String postingLink;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @Version
    private long version;

    @Builder.Default
    @OneToMany(mappedBy = "application", cascade = {
        jakarta.persistence.CascadeType.PERSIST,
        jakarta.persistence.CascadeType.MERGE
    })
    private List<ApplicationStatusEvent> statusEvents = new ArrayList<>();

    public void recordStatusTransition(ApplicationStatus previousStatus, ApplicationStatus newStatus) {
        statusEvents.add(ApplicationStatusEvent.builder()
            .application(this)
            .previousStatus(previousStatus)
            .newStatus(newStatus)
            .build());
    }
}
