package app.careerflow.rs.user.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.dto.UserRequest;

class UserMapperTest {

    private final UserMapper mapper = new UserMapper();

    @Test
    void mapsEntityToDto() {
        UUID id = UUID.randomUUID();
        LocalDate dob = LocalDate.of(1990, 1, 1);
        Timestamp createdAt = Timestamp.valueOf("2026-09-17 10:00:00");
        User user = User.builder().id(id).username("javier").dob(dob)
            .cv("cv.pdf").createdAt(createdAt).build();

        var dto = mapper.apply(user);

        assertThat(dto.id()).isEqualTo(id);
        assertThat(dto.username()).isEqualTo("javier");
        assertThat(dto.dob()).isEqualTo(dob);
        assertThat(dto.cv()).isEqualTo("cv.pdf");
        assertThat(dto.createdAt()).isEqualTo(createdAt);
    }

    @Test
    void mapsRequestToEntity() {
        UserRequest request = new UserRequest("javier", LocalDate.of(1990, 1, 1), "cv.pdf");

        User user = mapper.toEntityUser(request);

        assertThat(user.getId()).isNull();
        assertThat(user.getUsername()).isEqualTo(request.username());
        assertThat(user.getDob()).isEqualTo(request.dob());
        assertThat(user.getCv()).isEqualTo(request.cv());
        assertThat(user.getCreatedAt()).isNull();
    }
}
