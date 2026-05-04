package com.unigate.registration.dto;

import com.unigate.registration.enums.DocumentStatus;
import com.unigate.registration.enums.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DocumentDTO {
    private Long id;
    private DocumentType type;
    private String fileName;
    private DocumentStatus status;
    private String validationMessage;
    private String reviewerAnnotation;
    private LocalDateTime uploadedAt;
    private String downloadUrl;
}
