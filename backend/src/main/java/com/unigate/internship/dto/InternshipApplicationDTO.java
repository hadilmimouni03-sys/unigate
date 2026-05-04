package com.unigate.internship.dto;

import com.unigate.internship.enums.ApplicationInternshipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InternshipApplicationDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long offerId;
    private String offerTitle;
    private String companyName;
    private ApplicationInternshipStatus status;
    private String coverLetter;
    private String cvFileName;
    private String cvDownloadUrl;
    private String adminNote;
    private LocalDateTime appliedAt;
}
