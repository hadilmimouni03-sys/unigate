package com.unigate.registration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateRegistrationPeriodRequest {
    @NotBlank private String name;
    @NotNull  private LocalDate startDate;
    @NotNull  private LocalDate endDate;
}
