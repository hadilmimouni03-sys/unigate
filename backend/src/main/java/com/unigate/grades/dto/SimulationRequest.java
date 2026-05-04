package com.unigate.grades.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SimulationRequest {
    @NotBlank private String moduleCode;
    @DecimalMin("0.0") @DecimalMax("20.0") private double ccMark;
    @DecimalMin("0.0") @DecimalMax("20.0") private double examMark;
}
