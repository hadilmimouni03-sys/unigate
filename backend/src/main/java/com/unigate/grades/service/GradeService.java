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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeService {

    private static final double PASSING_MARK = 10.0;

    private final StudentGradeRepository gradeRepository;
    private final GradeConfigRepository  configRepository;
    private final StudentRepository      studentRepository;
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
            config.setParentModuleName(dto.getParentModuleName());
            return toConfigDTO(configRepository.save(config));
        }).collect(Collectors.toList());
    }


    public SimulationResult simulateFull(SimulationRequest request) {
        if (request.getGrades() == null || request.getGrades().isEmpty()) {
            return SimulationResult.builder()
                    .semesters(List.of()).overallGpa(null)
                    .totalCredits(0).earnedCredits(0).lostCredits(0).build();
        }

        List<String> codes = request.getGrades().stream()
                .map(SimulationRequest.SubjectMarkInput::getModuleCode)
                .collect(Collectors.toList());

        Map<String, GradeConfig> configMap = configRepository.findByModuleCodeIn(codes).stream()
                .collect(Collectors.toMap(GradeConfig::getModuleCode, c -> c));

        List<SimulationResult.SubjectResult> subjects = new ArrayList<>();
        for (SimulationRequest.SubjectMarkInput input : request.getGrades()) {
            GradeConfig c = configMap.get(input.getModuleCode());
            if (c == null) continue;

            Double cc   = input.getCcMark();
            Double exam = input.getExamMark();
            Double tp   = input.getTpMark();

            Double avg = null;
            boolean passed = false;
            String requiredExam = null;

            if (cc != null && exam != null) {
                double tpContrib = (c.getTpWeight() > 0 && tp != null) ? c.getTpWeight() * tp : 0.0;
                double raw = c.getCcWeight() * cc + c.getExamWeight() * exam + tpContrib;
                avg = round2(raw);
                passed = avg >= PASSING_MARK;
                requiredExam = computeRequiredExam(c, cc, tp);
            }

            subjects.add(SimulationResult.SubjectResult.builder()
                    .moduleCode(c.getModuleCode())
                    .subjectName(c.getModuleName())
                    .semester(c.getSemester())
                    .subjectAvg(avg)
                    .credits(c.getCredits())
                    .ccMark(cc).examMark(exam).tpMark(tp)
                    .ccWeight(c.getCcWeight() * 100)
                    .examWeight(c.getExamWeight() * 100)
                    .tpWeight(c.getTpWeight() * 100)
                    .passed(passed)
                    .requiredExam(requiredExam)
                    .build());
        }

        Map<Integer, List<SimulationResult.SubjectResult>> bySemester = subjects.stream()
                .collect(Collectors.groupingBy(SimulationResult.SubjectResult::getSemester));

        List<SimulationResult.SemesterResult> semesterResults = new ArrayList<>();
        int totalCredits = 0, earnedCredits = 0, lostCredits = 0;
        double gpaWeightedSum = 0;
        int gpaWeightedCredits = 0;

        for (int sem : bySemester.keySet().stream().sorted().collect(Collectors.toList())) {
            List<SimulationResult.SubjectResult> semSubjects = bySemester.get(sem);

            Map<String, List<SimulationResult.SubjectResult>> byModule = semSubjects.stream()
                    .collect(Collectors.groupingBy(s -> {
                        GradeConfig c = configMap.get(s.getModuleCode());
                        return (c.getParentModuleName() != null && !c.getParentModuleName().isBlank())
                                ? c.getParentModuleName() : c.getModuleName();
                    }));

            List<SimulationResult.ModuleResult> moduleResults = new ArrayList<>();
            int semEarned = 0, semTotal = 0;
            double semWeighted = 0;
            int semWeightedCred = 0;

            for (Map.Entry<String, List<SimulationResult.SubjectResult>> modEntry : byModule.entrySet()) {
                List<SimulationResult.SubjectResult> modSubjects = modEntry.getValue();
                int modCredits = modSubjects.stream().mapToInt(SimulationResult.SubjectResult::getCredits).sum();

                Double moduleAvg = null;
                if (modSubjects.stream().allMatch(s -> s.getSubjectAvg() != null)) {
                    double weightedSum = modSubjects.stream()
                            .mapToDouble(s -> s.getSubjectAvg() * s.getCredits()).sum();
                    moduleAvg = modCredits > 0 ? round2(weightedSum / modCredits) : null;
                }

                boolean modPassed = moduleAvg != null && moduleAvg >= PASSING_MARK;
                semTotal    += modCredits;
                totalCredits += modCredits;
                if (modPassed) {
                    semEarned    += modCredits;
                    earnedCredits += modCredits;
                } else {
                    lostCredits += modCredits;
                }
                if (moduleAvg != null) {
                    semWeighted     += moduleAvg * modCredits;
                    semWeightedCred += modCredits;
                }

                moduleResults.add(SimulationResult.ModuleResult.builder()
                        .moduleName(modEntry.getKey())
                        .moduleAvg(moduleAvg)
                        .passed(modPassed)
                        .credits(modCredits)
                        .subjects(modSubjects)
                        .build());
            }

            Double semAvg = semWeightedCred > 0 ? round2(semWeighted / semWeightedCred) : null;
            if (semAvg != null) {
                gpaWeightedSum    += semAvg * semWeightedCred;
                gpaWeightedCredits += semWeightedCred;
            }

            semesterResults.add(SimulationResult.SemesterResult.builder()
                    .semester(sem)
                    .semesterAvg(semAvg)
                    .earnedCredits(semEarned)
                    .totalCredits(semTotal)
                    .modules(moduleResults)
                    .build());
        }

        Double overallGpa = gpaWeightedCredits > 0 ? round2(gpaWeightedSum / gpaWeightedCredits) : null;

        return SimulationResult.builder()
                .semesters(semesterResults)
                .overallGpa(overallGpa)
                .totalCredits(totalCredits)
                .earnedCredits(earnedCredits)
                .lostCredits(lostCredits)
                .build();
    }

    private void applyComputed(StudentGrade grade, GradeConfig config) {
        Double cc   = grade.getCcMark();
        Double exam = grade.getExamMark();
        Double tp   = grade.getTpMark();
        if (cc == null || exam == null) {
            grade.setFinalMark(null);
            grade.setPassed(null);
            grade.setRequiredExamToPass(null);
            return;
        }
        double tpContrib = (config.getTpWeight() > 0 && tp != null) ? config.getTpWeight() * tp : 0;
        double finalMark = round2(config.getCcWeight() * cc + config.getExamWeight() * exam + tpContrib);
        grade.setFinalMark(finalMark);
        grade.setPassed(finalMark >= PASSING_MARK);
        grade.setRequiredExamToPass(computeRequiredExam(config, cc, tp));
    }

    private String computeRequiredExam(GradeConfig config, double ccMark, Double tpMark) {
        double tpPart = (config.getTpWeight() > 0 && tpMark != null) ? config.getTpWeight() * tpMark : 0.0;
        double required = (PASSING_MARK - config.getCcWeight() * ccMark - tpPart) / config.getExamWeight();
        if (required > 20.0) return "IMPOSSIBLE";
        if (required <= 0.0) return "ALREADY_VALIDATED";
        return String.format("%.2f", required);
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }

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
                .parentModuleName(c.getParentModuleName())
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
                .parentModuleName(c.getParentModuleName())
                .build();
    }
}
