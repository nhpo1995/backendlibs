package vn.railway89.lab;

import jakarta.validation.*;
import jakarta.validation.constraints.*;
import java.lang.annotation.*;
import java.time.LocalDate;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.web.bind.annotation.*;

@Documented
@Constraint(validatedBy = StrongPassword.Rule.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
@interface StrongPassword {
    String message() default "{password.complex}";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    class Rule implements ConstraintValidator<StrongPassword, String> {
        private static final Pattern RULE = Pattern.compile(
            "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[!-~]{8,72}");
        public boolean isValid(String value, ConstraintValidatorContext ctx) {
            return value == null || RULE.matcher(value).matches();
        }
    }
}

@RestController
class Registration {
    enum Gender { FEMALE, MALE, UNSPECIFIED }

    record Input(
        @NotBlank @jakarta.validation.constraints.Pattern(regexp="[A-Za-z0-9_]{3,20}") String username,
        @NotBlank @StrongPassword String password,
        @NotBlank @Email @Size(max=100) String email,
        @NotBlank @Size(max=80) String fullName,
        @NotBlank @jakarta.validation.constraints.Pattern(regexp="\\+?[0-9]{9,15}") String phoneNumber,
        @NotNull @Past LocalDate birthDate,
        @NotBlank @Size(max=200) String address,
        @NotNull @AssertTrue Boolean acceptPolicy,
        @NotNull Gender gender,
        @NotBlank @Size(max=80) String securityQuestion,
        @NotBlank @Size(max=80) String securityAnswer) {}

    @PostMapping(value = "/api/registration-check", consumes = "application/json")
    Map<String, Boolean> check(@Valid @RequestBody Input input) { return Map.of("valid", true); }
}
