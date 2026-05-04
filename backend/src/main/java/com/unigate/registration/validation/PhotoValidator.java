package com.unigate.registration.validation;

import com.unigate.registration.entity.Document;
import com.unigate.registration.enums.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class PhotoValidator implements DocumentValidator {

    private static final long MAX_SIZE_BYTES = 1024 * 1024; // 1 MB

    @Override
    public ValidationResult validate(Document document) {
        if (document.getType() != DocumentType.PHOTO) {
            return ValidationResult.fail("Wrong validator for document type: " + document.getType());
        }
        if (document.getFileName() == null || document.getFileName().isBlank()) {
            return ValidationResult.fail("Photo file name is missing");
        }
        String lower = document.getFileName().toLowerCase();
        if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
            return ValidationResult.fail("Photo must be JPG or PNG");
        }
        if (document.getFileSize() != null && document.getFileSize() > MAX_SIZE_BYTES) {
            return ValidationResult.fail("Photo file exceeds 1 MB limit");
        }
        return ValidationResult.ok();
    }
}
