package app.careerflow.rs.common.exception;

import java.util.List;

import app.careerflow.rs.common.error.ApiErrorDetails;

public class ConflictException extends Exception{

    private List<ApiErrorDetails> details;

    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, List<ApiErrorDetails> details) {
        super(message);
        this.details = details;
    }

    public List<ApiErrorDetails> getDetails() {
        return details;
    }

    public void setDetails(List<ApiErrorDetails> details) {
        this.details = details;
    }

}
