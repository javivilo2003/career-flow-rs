package app.careerflow.rs.job_application.service;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Sort;

import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.job_application.mapper.JobApplicationDTOMapper;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class JobApplicationServiceTest {

    @Mock
    private JobApplicationRepository repository;

    @Mock 
    private JobApplicationDTOMapper mapper;

    @Mock 
    private CompanyRepository companyRepository;

    @Mock 
    private UserRepository userRepository;

    @InjectMocks 
    private JobApplicationService service;

    @Test 
    void insupportedSortingFieldIsRejected(){
        JobApplicationFilter emptyFilter = new JobApplicationFilter(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );

        assertThatThrownBy(() -> 
            service.getJobApplications(
                emptyFilter,
                0,
                10,
                "unknownField",
                Sort.Direction.ASC
            )
        )
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage(
                "Unsupported sorting field: unknownField"
            );
        verifyNoInteractions(repository);
    }

}
