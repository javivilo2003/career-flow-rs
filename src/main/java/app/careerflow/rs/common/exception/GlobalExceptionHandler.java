package app.careerflow.rs.common.exception;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import app.careerflow.rs.common.error.ApiError;
import app.careerflow.rs.common.error.ApiErrorDetails;
import app.careerflow.rs.common.error.ErrorCode;
import app.careerflow.rs.common.error.ErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex){

        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(
                new ApiError(ErrorCode.NOT_FOUND, ex.getMessage(), null
                )));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ApiErrorDetails> details = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fieldError -> new ApiErrorDetails(
                fieldError.getField(),
                fieldError.getDefaultMessage()
            ))
            .toList();

        return ResponseEntity.badRequest()
            .body(new ErrorResponse(
                new ApiError(
                    ErrorCode.VALIDATION_ERROR,
                    "One or more fields are invalid.",
                    details
                )
            ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String field = ex.getName();

        List<ApiErrorDetails> details = List.of(
            new ApiErrorDetails(
                field,
                field + " must be a valid value."
            )
        );

        return ResponseEntity.badRequest()
            .body(new ErrorResponse(
                new ApiError(
                    ErrorCode.INVALID_REQUEST,
                    "Invalid request parameter.",
                    details
                )
            ));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingRequestParameter(
            MissingServletRequestParameterException ex) {
        List<ApiErrorDetails> details = List.of(
            new ApiErrorDetails(
                ex.getParameterName(),
                ex.getParameterName() + " is required."
            )
        );

        return ResponseEntity.badRequest()
            .body(new ErrorResponse(
                new ApiError(
                    ErrorCode.INVALID_REQUEST,
                    "Required request parameter is missing.",
                    details
                )
            ));
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleMethodValidation(
            HandlerMethodValidationException ex) {
        List<ApiErrorDetails> details = ex.getParameterValidationResults()
            .stream()
            .flatMap(result -> result.getResolvableErrors()
                .stream()
                .map(error -> new ApiErrorDetails(
                    result.getMethodParameter().getParameterName(),
                    error.getDefaultMessage()
                )))
            .toList();

        return ResponseEntity.badRequest()
            .body(new ErrorResponse(
                new ApiError(
                    ErrorCode.VALIDATION_ERROR,
                    "One or more request parameters are invalid.",
                    details
                )
            ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMalformedJson(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
        .body(new ErrorResponse(
            new ApiError(
                ErrorCode.INVALID_REQUEST,
                "Request body must be valid JSON.",
                null
            ))
        );
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflicts(ConflictException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(
                new ApiError(
                    ErrorCode.CONFLICT,
                    ex.getMessage(),
                    ex.getDetails()
                )
            ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedErrors(Exception ex) {
        return ResponseEntity.internalServerError()
            .body(new ErrorResponse(
                new ApiError(
                    ErrorCode.INTERNAL_ERROR,
                    "Unexpected error.",
                    null
                )
            ));
    }



}
