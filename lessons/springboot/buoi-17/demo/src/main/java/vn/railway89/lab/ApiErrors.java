package vn.railway89.lab;

import java.net.URI;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.*;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

final class LabError extends RuntimeException {
    final HttpStatus status;
    final String code;
    private LabError(HttpStatus status, String code, String detail) {
        super(detail); this.status = status; this.code = code;
    }
    static LabError missing(String kind, long id) {
        return new LabError(HttpStatus.NOT_FOUND, "NOT_FOUND", kind + " " + id + " was not found.");
    }
    static LabError badInput(String detail) {
        return new LabError(HttpStatus.BAD_REQUEST, "INVALID_PARAMETER", detail);
    }
}

@RestControllerAdvice
class ApiErrors extends ResponseEntityExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiErrors.class);
    record FieldIssue(String field, String message) {}
    private final MessageSource messages;
    ApiErrors(MessageSource messages) { this.messages = messages; }

    @ExceptionHandler(LabError.class)
    ResponseEntity<Object> domain(LabError ex, WebRequest request) {
        return response(ex.status, ex.code, ex.getMessage(), null, HttpHeaders.EMPTY, request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Object> conflict(DataIntegrityViolationException ex, WebRequest request) {
        // This lab owns the schema. Inspect SQL state/constraint before classifying in production.
        String id = logId();
        log.warn("Data constraint rejected request id={}", id);
        return response(HttpStatus.CONFLICT, "CONFLICT", "A data constraint prevented the change.", null, HttpHeaders.EMPTY, request);
    }

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<Object> unexpected(RuntimeException ex, WebRequest request) {
        String id = logId();
        // Exception type and correlation ID keep the lab log clear of raw request data.
        log.error("Unexpected failure id={} type={}", id, ex.getClass().getName());
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Try again later.", null, HttpHeaders.EMPTY, request, id);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        var fields = ex.getBindingResult().getFieldErrors().stream()
            .sorted(Comparator.comparing(org.springframework.validation.FieldError::getField)
                .thenComparing(e -> Objects.toString(e.getCode(), "")))
            .map(e -> new FieldIssue(e.getField(), e.isBindingFailure() ? "Invalid value." : e.getDefaultMessage()))
            .toList();
        String detail = messages.getMessage("error.validation", null, LocaleContextHolder.getLocale());
        return response(status, "VALIDATION_FAILED", detail, fields, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        return response(status, "INVALID_JSON", "Provide a JSON body with the expected fields and types.", null, headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
                                                              HttpStatusCode status, WebRequest request) {
        String code = switch (status.value()) {
            case 400 -> "INVALID_PARAMETER";
            case 404 -> "NOT_FOUND";
            case 405 -> "METHOD_NOT_ALLOWED";
            case 415 -> "UNSUPPORTED_MEDIA_TYPE";
            default -> "HTTP_ERROR";
        };
        String detail = switch (status.value()) {
            case 400 -> "Check the request parameters.";
            case 415 -> "Use Content-Type: application/json for a JSON body.";
            default -> "Check the request and try again.";
        };
        return response(status, code, detail, null, headers, request);
    }

    private ResponseEntity<Object> response(HttpStatusCode status, String code, String detail, List<FieldIssue> issues,
                                            HttpHeaders headers, WebRequest request) {
        return response(status, code, detail, issues, headers, request, null);
    }
    private ResponseEntity<Object> response(HttpStatusCode status, String code, String detail, List<FieldIssue> issues,
                                            HttpHeaders headers, WebRequest request, String id) {
        var p = ProblemDetail.forStatusAndDetail(status, detail);
        p.setProperty("code", code);
        if (issues != null) p.setProperty("errors", issues);
        if (id != null) p.setProperty("requestId", id);
        if (request instanceof ServletWebRequest servlet) p.setInstance(URI.create(servlet.getRequest().getRequestURI()));
        return ResponseEntity.status(status).headers(headers).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(p);
    }
    private static String logId() { return UUID.randomUUID().toString(); }
}
