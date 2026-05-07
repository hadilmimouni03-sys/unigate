package com.unigate.grades.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SimulationResult {

    private List<SemesterResult> semesters;
    private Double overallGpa;
    private int totalCredits;
    private int earnedCredits;
    private int lostCredits;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SemesterResult {
        private int semester;
        private Double semesterAvg;
        private int earnedCredits;
        private int totalCredits;
        private List<ModuleResult> modules;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ModuleResult {
        private String moduleName;
        private Double moduleAvg;
        private boolean passed;
        private int credits;
        private List<SubjectResult> subjects;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectResult {
        private String moduleCode;
        private String subjectName;
        private int semester;
        private Double subjectAvg;
        private int credits;
        private Double ccMark;
        private Double examMark;
        private Double tpMark;
        private double ccWeight;
        private double examWeight;
        private double tpWeight;
        private boolean passed;
        /** "IMPOSSIBLE" | "ALREADY_VALIDATED" | "X.XX" | null (no CC yet) */
        private String requiredExam;
        private boolean adminEntered;
    }
}
