package com.unigate.grades.service;

import com.unigate.exception.BusinessException;
import com.unigate.exception.ResourceNotFoundException;
import com.unigate.grades.dto.GradeDTO;
import com.unigate.grades.dto.GradeEntryRequest;
import com.unigate.grades.entity.GradeConfig;
import com.unigate.grades.entity.StudentGrade;
import com.unigate.grades.repository.GradeConfigRepository;
import com.unigate.grades.repository.StudentGradeRepository;
import com.unigate.notification.event.GradeEnteredEvent;
import com.unigate.registration.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeService {

    private static final double PASSING_MARK = 10.0;

    private final StudentGradeRepository gradeRepository;
    private final GradeConfigRepository configRepository;
    private final StudentRepository studentRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public GradeDTO enterGrade(GradeEntryRequest request) {
        GradeConfig config = configRepository.findByModuleCode(request.getModuleCode())
                .orElseThrow(() -> new ResourceNotFoundException("Module " + request.getModuleCode() + " not found"));

        var student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.getStudentId()));

        StudentGrade grade = gradeRepository
                .findByStudentIdAndGradeConfigModuleCode(request.getStudentId(), request.getModuleCode())
                .orElse(StudentGrade.builder().student(student).gradeConfig(config).build());

        grade.setCcMark(request.getCcMark());
        grade.setExamMark(request.getExamMark());

        Double finalMark = computeFinal(config, request.getCcMark(), request.getExamMark());
        grade.setFinalMark(finalMark);
        grade.setPassed(finalMark != null && finalMark >= PASSING_MARK);

        grade = gradeRepository.save(grade);

        if (finalMark != null) {
            eventPublisher.publishEvent(
                    new GradeEnteredEvent(this, student.getId(), config.getModuleName(), finalMark));
        }
        return toDTO(grade);
    }

    @Transactional(readOnly = true)
    public List<GradeDTO> getGradesForStudent(Long studentId) {
        return gradeRepository.findByStudentId(studentId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GradeDTO> getGradesForStudentBySemester(Long studentId, int semester) {
        return gradeRepository.findByStudentIdAndGradeConfigSemester(studentId, semester)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Simulate: given cc and exam marks return what the final would be and whether it passes */
    public Map<String, Object> simulate(String moduleCode, double ccMark, double examMark) {
        GradeConfig config = configRepository.findByModuleCode(moduleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Module " + moduleCode + " not found"));
        double finalMark = config.getCcWeight() * ccMark + config.getExamWeight() * examMark;
        return Map.of(
                "finalMark", Math.round(finalMark * 100.0) / 100.0,
                "passed", finalMark >= PASSING_MARK,
                "requiredExamToPass", computeRequiredExam(config, ccMark)
        );
    }

    /**
     * Tunisian inverse formula:
     * requiredExam = (10 - ccWeight * ccMark) / examWeight
     * Returns "IMPOSSIBLE" when result > 20.
     */
    private String computeRequiredExam(GradeConfig config, double ccMark) {
        double required = (PASSING_MARK - config.getCcWeight() * ccMark) / config.getExamWeight();
        if (required > 20.0) return "IMPOSSIBLE";
        if (required < 0.0) return "0.00";
        return String.format("%.2f", required);
    }

    private Double computeFinal(GradeConfig config, Double cc, Double exam) {
        if (cc == null || exam == null) return null;
        return config.getCcWeight() * cc + config.getExamWeight() * exam;
    }

    private GradeDTO toDTO(StudentGrade g) {
        GradeConfig c = g.getGradeConfig();
        return GradeDTO.builder()
                .id(g.getId())
                .studentId(g.getStudent().getId())
                .moduleCode(c.getModuleCode())
                .moduleName(c.getModuleName())
                .credits(c.getCredits())
                .semester(c.getSemester())
                .ccMark(g.getCcMark())
                .examMark(g.getExamMark())
                .finalMark(g.getFinalMark())
                .passed(g.getPassed())
                .requiredExamToPass(g.getCcMark() != null ? computeRequiredExam(c, g.getCcMark()) : null)
                .build();
    }
}
