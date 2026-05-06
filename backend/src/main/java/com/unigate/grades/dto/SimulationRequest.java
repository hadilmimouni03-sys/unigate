package com.unigate.grades.dto;

import lombok.Data;
import java.util.List;

@Data
public class SimulationRequest {
    private List<SubjectMarkInput> grades;

    @Data
    public static class SubjectMarkInput {
        private String moduleCode;
        private Double ccMark;
        private Double examMark;
        private Double tpMark;
    }
}
