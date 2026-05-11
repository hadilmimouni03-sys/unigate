package com.unigate.registration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RegistrationPeriodDTO {
    private Long id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private long totalApplications;
}
