package app.careerflow.rs.user.dto;


import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.UUID;

public record UserDTO(
    UUID id, 
    String username,
    LocalDate dob,
    String cv,
    Timestamp createdAt
) {
    
}
