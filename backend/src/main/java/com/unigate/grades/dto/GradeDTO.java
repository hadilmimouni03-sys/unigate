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
    private int credits;
    private int semester;
    private Double ccMark;
    private Double examMark;
    private Double finalMark;
    private Boolean passed;
    /** Exam mark needed to pass given the current CC mark. "IMPOSSIBLE" if unreachable. */
    private String requiredExamToPass;
}
