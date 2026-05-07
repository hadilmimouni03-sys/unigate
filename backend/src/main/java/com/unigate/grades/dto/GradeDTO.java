package com.unigate.grades.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GradeDTO {
    private Long id;
    private Long studentId;
    private String moduleCode;
    private String moduleName;
    private String department;
    private int credits;
    private int semester;
    private double ccWeight;
    private double examWeight;
    private double tpWeight;
    private Double ccMark;
    private Double examMark;
    private Double tpMark;
    private Double finalMark;
    private Boolean passed;
    private String requiredExamToPass;
    private boolean adminEntered;
    private String parentModuleName;
}
