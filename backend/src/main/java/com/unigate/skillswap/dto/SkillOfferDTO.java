package com.unigate.skillswap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SkillOfferDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Set<String> skillsOffered;
    private Set<String> skillsWanted;
    private String description;
    private String availability;
    private boolean active;
    private LocalDateTime createdAt;
    private Double averageRating;
}
