package com.unigate.registration.validation;

import com.unigate.registration.entity.Document;
import com.unigate.registration.enums.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class DiplomaValidator implements DocumentValidator {

    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    @Override
    public ValidationResult validate(Document document) {
        if (document.getType() != DocumentType.DIPLOMA) {
            return ValidationResult.fail("Wrong validator for document type: " + document.getType());
        }
        if (document.getFileName() == null || document.getFileName().isBlank()) {
            return ValidationResult.fail("Diploma file name is missing");
        }
        String lower = document.getFileName().toLowerCase();
        if (!lower.endsWith(".pdf")) {
            return ValidationResult.fail("Diploma must be a PDF file");
        }
        if (document.getFileSize() != null && document.getFileSize() > MAX_SIZE_BYTES) {
            return ValidationResult.fail("Diploma file exceeds 5 MB limit");
        }
        return ValidationResult.ok();
    }
}
