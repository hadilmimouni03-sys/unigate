package com.unigate.grades.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GradeEntryRequest {
    @NotNull private Long studentId;
    @NotBlank private String moduleCode;
    @DecimalMin("0.0") @DecimalMax("20.0") private Double ccMark;
    @DecimalMin("0.0") @DecimalMax("20.0") private Double examMark;
}
