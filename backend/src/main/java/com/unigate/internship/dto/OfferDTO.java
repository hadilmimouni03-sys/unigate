package com.unigate.internship.dto;

import com.unigate.internship.enums.OfferStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OfferDTO {
    private Long id;
    private Long companyId;
    private String companyName;
    private String title;
    private String description;
    private String requiredDepartment;
    private String requiredSpeciality;
    private String internshipType;
    private String targetYear;
    private int durationMonths;
    private OfferStatus status;
    private LocalDate applicationDeadline;
    private LocalDateTime publishedAt;
    private String location;
    private String contactEmail;
    private String companyWebsite;
    private Double minGpa;
    private String linkedInUrl;
}
