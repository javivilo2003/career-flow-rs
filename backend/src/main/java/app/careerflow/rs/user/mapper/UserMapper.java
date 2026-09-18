package app.careerflow.rs.user.mapper;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.dto.UserDTO;
import app.careerflow.rs.user.dto.UserRequest;

@Service
public class UserMapper implements Function<User, UserDTO>{

    @Override
    public UserDTO apply(User t) {
        return new UserDTO(
            t.getId(),
            t.getUsername(),
            t.getDob(),
            t.getCv(),
            t.getCreatedAt()
        );
    }

    public User toEntityUser(UserRequest request){
        return User.builder()
            .username(request.username())
            .dob(request.dob())
            .cv(request.cv())
            .build();
    }
    
}
    

