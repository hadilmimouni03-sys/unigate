package com.unigate.registration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DepartmentStatsDTO {
    private String name;
    private int totalApplications;
    private int enrolled;
    private int pending;
    private int underReview;
    private int refused;
    private int slaCompliance;
    private int adminCount;
}
