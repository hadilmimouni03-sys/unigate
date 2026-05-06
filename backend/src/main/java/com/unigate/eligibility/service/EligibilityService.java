package com.unigate.eligibility.service;

import com.unigate.eligibility.dto.EligibilityRuleDTO;
import com.unigate.eligibility.entity.EligibilityRule;
import com.unigate.eligibility.repository.EligibilityRuleRepository;
import com.unigate.grades.repository.StudentGradeRepository;
import com.unigate.registration.entity.Student;
import com.unigate.registration.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EligibilityService {

    private final EligibilityRuleRepository ruleRepository;
    private final StudentRepository studentRepository;
    private final StudentGradeRepository gradeRepository;

    @Transactional(readOnly = true)
    public List<EligibilityRuleDTO> getRules(String department, String yearLevel) {
        List<EligibilityRule> rules = (yearLevel != null && !yearLevel.isBlank())
                ? ruleRepository.findByDepartmentAndYearLevel(department, yearLevel)
                : ruleRepository.findByDepartment(department);
        return rules.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public List<EligibilityRuleDTO> saveRules(String department, String yearLevel,
                                               List<EligibilityRuleDTO> dtos) {
        ruleRepository.deleteByDepartmentAndYearLevel(department, yearLevel);
        ruleRepository.flush();
        List<EligibilityRule> saved = dtos.stream().map(dto -> EligibilityRule.builder()
                .department(department)
                .yearLevel(yearLevel)
                .ruleName(dto.getRuleName())
                .conditionType(dto.getConditionType() != null ? dto.getConditionType() : "GPA_GTE")
                .targetValue(dto.getTargetValue())
                .enabled(dto.isEnabled())
                .build()
        ).collect(Collectors.toList());
        return ruleRepository.saveAll(saved).stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Checks a student against eligibility rules for their department + year level.
     * Returns a list of human-readable violation messages (empty = all pass).
     */
    @Transactional(readOnly = true)
    public List<String> checkStudent(Long studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return List.of();

        String dept = student.getDepartment();
        // Year level is not stored on Student in current model — use a placeholder.
        // When the student's year level is available, replace with the real field.
        String yearLevel = "1st Year";

        List<EligibilityRule> rules = ruleRepository.findByDepartmentAndYearLevel(dept, yearLevel)
                .stream().filter(EligibilityRule::isEnabled).collect(Collectors.toList());

        List<String> violations = new ArrayList<>();
        for (EligibilityRule rule : rules) {
            if (!evaluateRule(rule, studentId)) {
                violations.add(rule.getRuleName() + " (" + rule.getConditionType()
                        + " " + rule.getTargetValue() + ")");
            }
        }
        return violations;
    }

    private boolean evaluateRule(EligibilityRule rule, Long studentId) {
        try {
            double target = Double.parseDouble(rule.getTargetValue());
            switch (rule.getConditionType()) {
                case "GPA_GTE": {
                    var grades = gradeRepository.findByStudentId(studentId);
                    if (grades.isEmpty()) return false;
                    double gpa = grades.stream()
                            .filter(g -> g.getFinalMark() != null)
                            .mapToDouble(g -> g.getFinalMark())
                            .average().orElse(0.0);
                    return gpa >= target;
                }
                case "CREDITS_GTE": {
                    var grades = gradeRepository.findByStudentId(studentId);
                    int credits = grades.stream()
                            .filter(g -> Boolean.TRUE.equals(g.getPassed()))
                            .mapToInt(g -> g.getGradeConfig().getCredits())
                            .sum();
                    return credits >= target;
                }
                default:
                    return true;
            }
        } catch (NumberFormatException e) {
            return true;
        }
    }

    private EligibilityRuleDTO toDTO(EligibilityRule r) {
        return EligibilityRuleDTO.builder()
                .id(r.getId())
                .department(r.getDepartment())
                .yearLevel(r.getYearLevel())
                .ruleName(r.getRuleName())
                .conditionType(r.getConditionType())
                .targetValue(r.getTargetValue())
                .enabled(r.isEnabled())
                .build();
    }
}
