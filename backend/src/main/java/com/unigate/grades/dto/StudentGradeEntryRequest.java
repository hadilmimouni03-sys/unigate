package com.unigate.grades.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StudentGradeEntryRequest {
    @NotBlank private String moduleCode;
    @Min(0) @Max(20) private Double ccMark;
    @Min(0) @Max(20) private Double examMark;
    @Min(0) @Max(20) private Double tpMark;
}
