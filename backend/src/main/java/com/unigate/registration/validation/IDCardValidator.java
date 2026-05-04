package com.unigate.registration.validation;

import com.unigate.registration.entity.Document;
import com.unigate.registration.enums.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class IDCardValidator implements DocumentValidator {

    private static final long MAX_SIZE_BYTES = 2 * 1024 * 1024;

    @Override
    public ValidationResult validate(Document document) {
        if (document.getType() != DocumentType.ID_CARD) {
            return ValidationResult.fail("Wrong validator for document type: " + document.getType());
        }
        if (document.getFileName() == null || document.getFileName().isBlank()) {
            return ValidationResult.fail("ID card file name is missing");
        }
        String lower = document.getFileName().toLowerCase();
        if (!lower.endsWith(".pdf") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
            return ValidationResult.fail("ID card must be PDF, JPG, or PNG");
        }
        if (document.getFileSize() != null && document.getFileSize() > MAX_SIZE_BYTES) {
            return ValidationResult.fail("ID card file exceeds 2 MB limit");
        }
        return ValidationResult.ok();
    }
}
