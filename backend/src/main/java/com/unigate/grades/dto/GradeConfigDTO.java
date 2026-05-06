package com.unigate.grades.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GradeConfigDTO {
    private Long id;
    private String moduleCode;
    private String moduleName;
    private String department;
    private double ccWeight;
    private double examWeight;
    private double tpWeight;
    private int credits;
    private int semester;
    @Builder.Default private double coefficient = 1.0;
    private String parentModuleName;
}
