package com.unigate.registration.dto;

import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.RegistrationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApplicationDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private RegistrationType registrationType;
    private ApplicationStatus status;
    private String reviewerComment;
    private String refusalReason;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DocumentDTO> documents;
    private int documentsTotal;
    private int documentsValid;
    private Long classGroupId;
    private String classGroupName;
    private String studentDepartment;
}
