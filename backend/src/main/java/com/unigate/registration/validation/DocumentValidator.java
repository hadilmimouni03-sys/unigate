package com.unigate.registration.validation;

import com.unigate.registration.entity.Document;
import lombok.Value;

public interface DocumentValidator {

    ValidationResult validate(Document document);

    @Value
    class ValidationResult {
        boolean valid;
        String message;

        public static ValidationResult ok() {
            return new ValidationResult(true, "Document validated successfully");
        }

        public static ValidationResult fail(String message) {
            return new ValidationResult(false, message);
        }
    }
}
