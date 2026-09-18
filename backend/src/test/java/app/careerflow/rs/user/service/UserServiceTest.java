package app.careerflow.rs.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.dto.UserDTO;
import app.careerflow.rs.user.dto.UserRequest;
import app.careerflow.rs.user.mapper.UserMapper;
import app.careerflow.rs.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository repository;
    @Mock private UserMapper mapper;
    @InjectMocks private UserService service;

    @Test
    void getAllUsersMapsEveryEntity() {
        User user = User.builder().build();
        when(repository.findAll()).thenReturn(List.of(user));
        when(mapper.apply(user)).thenReturn(
            new UserDTO(UUID.randomUUID(), "javier", null, null, null)
        );

        assertThat(service.getAllUsers()).hasSize(1);
        verify(mapper).apply(user);
    }

    @Test
    void getUserByIdRejectsUnknownUser() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getUserById(id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("User with id: " + id + " not found");
    }

    @Test
    void addNewUserMapsAndSavesRequest() {
        UserRequest request = new UserRequest("javier", LocalDate.of(1990, 1, 1), "cv.pdf");
        User user = User.builder().username("javier").build();
        when(mapper.toEntityUser(request)).thenReturn(user);

        service.addNewUser(request);

        verify(repository).save(user);
    }
}
