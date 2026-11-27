package vn.railway97.security;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ProblemDetail> duplicate() {
        return ResponseEntity.status(409).body(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Username đã tồn tại"));
    }
    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ProblemDetail> labFailure() {
        return ResponseEntity.internalServerError().body(ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Lỗi mô phỏng sau save; hãy đọc lại dữ liệu để kiểm tra transaction"));
    }
}
