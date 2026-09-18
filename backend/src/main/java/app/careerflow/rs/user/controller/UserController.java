package app.careerflow.rs.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.user.dto.UserDTO;
import app.careerflow.rs.user.dto.UserRequest;
import app.careerflow.rs.user.service.UserService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping()
    public List<UserDTO> getAllUsers(){
        return service.getAllUsers();
    }

    @GetMapping("{id}")
    public UserDTO GetUserById(@PathVariable UUID id) throws ResourceNotFoundException{
        return service.getUserById(id);
    }

    @PostMapping()
    public void addNewUser(@Valid @RequestBody UserRequest request){
        service.addNewUser(request);
    }

}
