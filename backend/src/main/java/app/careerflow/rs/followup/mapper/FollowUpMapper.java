package app.careerflow.rs.followup.mapper;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import app.careerflow.rs.followup.domain.FollowUp;
import app.careerflow.rs.followup.dto.FollowUpDTO;
import app.careerflow.rs.followup.dto.FollowUpRequest;
import app.careerflow.rs.job_application.domain.JobApplication;

@Service
public class FollowUpMapper implements Function<FollowUp, FollowUpDTO>{

    @Override
    public FollowUpDTO apply(FollowUp t) {
        return new FollowUpDTO(
            t.getApplication().getId(),
            t.getTitle(),
            t.getDueDate(),
            t.isCompleted()
        );
    }

    public FollowUp toEntityFollowUp(FollowUpRequest request, JobApplication application){
        return FollowUp.builder()
            .application(application)
            .title(request.title())
            .dueDate(request.dueDate())
            .completed(request.completed())
            .build();
    }
    
}
