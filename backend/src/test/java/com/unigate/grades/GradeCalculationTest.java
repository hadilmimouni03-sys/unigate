package com.unigate.grades;

import com.unigate.grades.entity.GradeConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class GradeCalculationTest {

    private static final double PASSING_MARK = 10.0;

    private double computeFinal(GradeConfig config, double cc, double exam) {
        return config.getCcWeight() * cc + config.getExamWeight() * exam;
    }

    private String computeRequiredExam(GradeConfig config, double ccMark) {
        double required = (PASSING_MARK - config.getCcWeight() * ccMark) / config.getExamWeight();
        if (required > 20.0) return "IMPOSSIBLE";
        if (required < 0.0) return "0.00";
        return String.format("%.2f", required);
    }

    private GradeConfig config(double ccWeight, double examWeight) {
        return GradeConfig.builder()
                .moduleCode("TEST01").moduleName("Test Module")
                .ccWeight(ccWeight).examWeight(examWeight)
                .credits(3).semester(1).build();
    }

    @Test
    void standardWeights_passingGrade() {
        GradeConfig cfg = config(0.4, 0.6);
        double final_ = computeFinal(cfg, 14.0, 12.0);
        assertThat(final_).isEqualTo(12.8, org.assertj.core.data.Offset.offset(0.001));
        assertThat(final_ >= PASSING_MARK).isTrue();
    }

    @Test
    void standardWeights_failingGrade() {
        GradeConfig cfg = config(0.4, 0.6);
        double final_ = computeFinal(cfg, 5.0, 6.0);
        assertThat(final_).isEqualTo(5.6, org.assertj.core.data.Offset.offset(0.001));
        assertThat(final_ >= PASSING_MARK).isFalse();
    }

    @ParameterizedTest
    @CsvSource({
        "0.4,0.6,14.0,4.67", 
        "0.4,0.6,0.0,16.67",   
        "0.4,0.6,20.0,0.00",   
    })
    void requiredExamFormula(double ccW, double examW, double cc, String expected) {
        GradeConfig cfg = config(ccW, examW);
        assertThat(computeRequiredExam(cfg, cc)).isEqualTo(expected);
    }

    @Test
    void requiredExam_impossible_whenCcTooLow() {
        
        GradeConfig cfg = config(0.1, 0.1);
        assertThat(computeRequiredExam(cfg, 0.0)).isEqualTo("IMPOSSIBLE");
    }
}
