package com.unigate.registration.validation;

import com.unigate.registration.entity.Document;
import com.unigate.registration.enums.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class AgreementValidator implements DocumentValidator {

    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024;

    @Override
    public ValidationResult validate(Document document) {
        if (document.getType() != DocumentType.AGREEMENT) {
            return ValidationResult.fail("Wrong validator for document type: " + document.getType());
        }
        if (document.getFileName() == null || document.getFileName().isBlank()) {
            return ValidationResult.fail("Agreement file name is missing");
        }
        String lower = document.getFileName().toLowerCase();
        if (!lower.endsWith(".pdf")) {
            return ValidationResult.fail("Agreement must be a PDF file");
        }
        if (document.getFileSize() != null && document.getFileSize() > MAX_SIZE_BYTES) {
            return ValidationResult.fail("Agreement file exceeds 5 MB limit");
        }
        return ValidationResult.ok();
    }
}
