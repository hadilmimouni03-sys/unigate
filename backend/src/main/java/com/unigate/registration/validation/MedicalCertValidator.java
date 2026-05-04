package com.unigate.registration.validation;

import com.unigate.registration.entity.Document;
import com.unigate.registration.enums.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class MedicalCertValidator implements DocumentValidator {

    private static final long MAX_SIZE_BYTES = 3 * 1024 * 1024;

    @Override
    public ValidationResult validate(Document document) {
        if (document.getType() != DocumentType.MEDICAL_CERT) {
            return ValidationResult.fail("Wrong validator for document type: " + document.getType());
        }
        if (document.getFileName() == null || document.getFileName().isBlank()) {
            return ValidationResult.fail("Medical certificate file name is missing");
        }
        String lower = document.getFileName().toLowerCase();
        if (!lower.endsWith(".pdf") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) {
            return ValidationResult.fail("Medical certificate must be PDF or JPG");
        }
        if (document.getFileSize() != null && document.getFileSize() > MAX_SIZE_BYTES) {
            return ValidationResult.fail("Medical certificate exceeds 3 MB limit");
        }
        return ValidationResult.ok();
    }
}
