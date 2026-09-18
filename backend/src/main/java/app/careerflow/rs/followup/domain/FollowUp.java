package app.careerflow.rs.followup.domain;

import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;

import app.careerflow.rs.job_application.domain.JobApplication;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "followups")
public class FollowUp {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "job_application_id", nullable = false)
    private JobApplication application;

    @NotNull
    private String title;

    @NotNull
    private LocalDate dueDate;

    @NotNull
    @ColumnDefault("false")
    private boolean completed;
}
