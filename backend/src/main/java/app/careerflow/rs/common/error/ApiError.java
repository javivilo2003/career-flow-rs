package app.careerflow.rs.common.error;



import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
    ErrorCode code, 
    String message,
    List<ApiErrorDetails> details
) {}
