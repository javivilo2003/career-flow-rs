package app.careerflow.rs.interview.mapper;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import app.careerflow.rs.interview.domain.Interview;
import app.careerflow.rs.interview.dto.InterviewDTO;
import app.careerflow.rs.interview.dto.InterviewRequest;
import app.careerflow.rs.job_application.domain.JobApplication;


@Service
public class InterviewMapper implements Function<Interview, InterviewDTO>{

    @Override
    public InterviewDTO apply(Interview t) {
        return new InterviewDTO(
            t.getId(),
            t.getJobApplication().getId(),
            t.getStage(),
            t.getStatus(),
            t.getInterviewDate(),
            t.getNotes()
        );
    }
    
    public Interview toEntityInterview(InterviewRequest request, JobApplication application){
        return Interview.builder()
            .jobApplication(application)
            .stage(request.stage())
            .status(request.status())
            .interviewDate(request.interviewDate())
            .notes(request.notes())
            .build();
    }
    
}
