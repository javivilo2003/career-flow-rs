package app.careerflow.rs.user.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.StreamSupport;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import app.careerflow.rs.common.exception.ConflictException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.dto.UserDTO;
import app.careerflow.rs.user.dto.UserRequest;
import app.careerflow.rs.user.mapper.UserMapper;
import app.careerflow.rs.user.repository.UserRepository;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository repository;
    private final UserMapper mapper;
    private final JobApplicationRepository jobApplicationRepository;


    public UserService(
        UserRepository repository,
        UserMapper mapper,
        JobApplicationRepository jobApplicationRepository
    ) {
        this.repository = repository;
        this.mapper = mapper;
        this.jobApplicationRepository = jobApplicationRepository;
    }

    public List<UserDTO> getAllUsers(){
        log.debug("Listing users");
        return StreamSupport.stream(repository.findAll().spliterator(), false)
            .map(mapper)
            .toList();
    }

    public UserDTO getUserById(UUID id) throws ResourceNotFoundException{
        log.debug("Fetching user id={}", id);
        return repository.findById(id)
            .map(mapper)
            .orElseThrow(() ->
                new ResourceNotFoundException("User with id: " + id + " not found"));
    }

    public void addNewUser(UserRequest request){
        User user = mapper.toEntityUser(request);
        repository.save(user);
        log.info("Created user id={}", user.getId());
    }

    public UserDTO updateUser(UUID id, UserRequest request) throws ResourceNotFoundException {
        User user = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User with id: " + id + " not found"));

        user.setUsername(request.username());
        user.setDob(request.dob());
        user.setCv(request.cv());

        repository.save(user);
        return mapper.apply(user);
    }

    public void deleteById(UUID id) throws ResourceNotFoundException, ConflictException {
        User user = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User with id: " + id + " not found"));

        if (jobApplicationRepository.existsByUserId(id)) {
            throw new ConflictException("User cannot be deleted while applications reference it.");
        }

        repository.delete(user);
    }
}
