package com.unigate.grades.service;

import com.unigate.exception.BusinessException;
import com.unigate.exception.ResourceNotFoundException;
import com.unigate.grades.dto.*;
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

    // ── Admin: enter official grade for a student ──────────────────────────
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
        grade.setTpMark(null);
        grade.setAdminEntered(true);
        applyComputed(grade, config);
        grade = gradeRepository.save(grade);

        if (grade.getFinalMark() != null) {
            eventPublisher.publishEvent(
                    new GradeEnteredEvent(this, student.getId(), config.getModuleName(), grade.getFinalMark()));
        }
        return toDTO(grade);
    }

    // ── Student: self-enter simulation grades ─────────────────────────────
    @Transactional
    public GradeDTO enterMyGrade(Long studentId, StudentGradeEntryRequest request) {
        GradeConfig config = configRepository.findByModuleCode(request.getModuleCode())
                .orElseThrow(() -> new ResourceNotFoundException("Module " + request.getModuleCode() + " not found"));
        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        StudentGrade existing = gradeRepository
                .findByStudentIdAndGradeConfigModuleCode(studentId, request.getModuleCode())
                .orElse(null);

        if (existing != null && existing.isAdminEntered()) {
            throw new BusinessException("Official grade already recorded for this module. Contact your admin to update it.");
        }

        StudentGrade grade = (existing != null) ? existing
                : StudentGrade.builder().student(student).gradeConfig(config).adminEntered(false).build();

        grade.setCcMark(request.getCcMark());
        grade.setExamMark(request.getExamMark());
        grade.setTpMark(config.getTpWeight() > 0 ? request.getTpMark() : null);
        applyComputed(grade, config);
        return toDTO(gradeRepository.save(grade));
    }

    // ── Student: fetch own grades ─────────────────────────────────────────
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

    // ── Config management (admin) ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<GradeConfigDTO> getConfigs(String department, Integer semester) {
        List<GradeConfig> configs = (semester != null)
                ? configRepository.findByDepartmentAndSemester(department, semester)
                : configRepository.findByDepartment(department);
        return configs.stream().map(this::toConfigDTO).collect(Collectors.toList());
    }

    @Transactional
    public List<GradeConfigDTO> saveConfigs(List<GradeConfigDTO> dtos, String department) {
        return dtos.stream().map(dto -> {
            GradeConfig config = configRepository.findByModuleCode(dto.getModuleCode())
                    .orElse(GradeConfig.builder().moduleCode(dto.getModuleCode()).build());
            config.setModuleName(dto.getModuleName());
            config.setDepartment(department);
            config.setCcWeight(dto.getCcWeight() / 100.0);
            config.setExamWeight(dto.getExamWeight() / 100.0);
            config.setTpWeight(dto.getTpWeight() / 100.0);
            config.setCredits(dto.getCredits());
            config.setSemester(dto.getSemester());
            return toConfigDTO(configRepository.save(config));
        }).collect(Collectors.toList());
    }

    // ── Simulation (public) ───────────────────────────────────────────────
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

    // ── Helpers ───────────────────────────────────────────────────────────
    private void applyComputed(StudentGrade grade, GradeConfig config) {
        Double cc = grade.getCcMark();
        Double exam = grade.getExamMark();
        Double tp = grade.getTpMark();
        if (cc == null || exam == null) {
            grade.setFinalMark(null);
            grade.setPassed(null);
            grade.setRequiredExamToPass(null);
            return;
        }
        double tpContrib = (config.getTpWeight() > 0 && tp != null) ? config.getTpWeight() * tp : 0;
        double finalMark = config.getCcWeight() * cc + config.getExamWeight() * exam + tpContrib;
        finalMark = Math.round(finalMark * 100.0) / 100.0;
        grade.setFinalMark(finalMark);
        grade.setPassed(finalMark >= PASSING_MARK);
        grade.setRequiredExamToPass(computeRequiredExam(config, cc));
    }

    private String computeRequiredExam(GradeConfig config, double ccMark) {
        double required = (PASSING_MARK - config.getCcWeight() * ccMark) / config.getExamWeight();
        if (required > 20.0) return "IMPOSSIBLE";
        if (required < 0.0) return "0.00";
        return String.format("%.2f", required);
    }

    private GradeDTO toDTO(StudentGrade g) {
        GradeConfig c = g.getGradeConfig();
        return GradeDTO.builder()
                .id(g.getId())
                .studentId(g.getStudent().getId())
                .moduleCode(c.getModuleCode())
                .moduleName(c.getModuleName())
                .department(c.getDepartment())
                .credits(c.getCredits())
                .semester(c.getSemester())
                .ccWeight(c.getCcWeight() * 100)
                .examWeight(c.getExamWeight() * 100)
                .tpWeight(c.getTpWeight() * 100)
                .ccMark(g.getCcMark())
                .examMark(g.getExamMark())
                .tpMark(g.getTpMark())
                .finalMark(g.getFinalMark())
                .passed(g.getPassed())
                .requiredExamToPass(g.getRequiredExamToPass())
                .adminEntered(g.isAdminEntered())
                .build();
    }

    private GradeConfigDTO toConfigDTO(GradeConfig c) {
        return GradeConfigDTO.builder()
                .id(c.getId())
                .moduleCode(c.getModuleCode())
                .moduleName(c.getModuleName())
                .department(c.getDepartment())
                .ccWeight(c.getCcWeight() * 100)
                .examWeight(c.getExamWeight() * 100)
                .tpWeight(c.getTpWeight() * 100)
                .credits(c.getCredits())
                .semester(c.getSemester())
                .build();
    }
}
