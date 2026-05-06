package com.unigate.grades.controller;

import com.unigate.grades.dto.*;
import com.unigate.grades.service.GradeService;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    /** Admin enters official grade for a specific student */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<GradeDTO> enterGrade(@Valid @RequestBody GradeEntryRequest request) {
        return ResponseEntity.ok(gradeService.enterGrade(request));
    }

    /** Student enters their own CC/Exam/TP grades */
    @PostMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GradeDTO> enterMyGrade(
            @Valid @RequestBody StudentGradeEntryRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gradeService.enterMyGrade(user.getId(), request));
    }

    /** Student fetches their own grades */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GradeDTO>> myGrades(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gradeService.getGradesForStudent(user.getId()));
    }

    /** Admin fetches grades for a specific student */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<GradeDTO>> studentGrades(
            @PathVariable Long studentId,
            @RequestParam(required = false) Integer semester) {
        List<GradeDTO> grades = (semester != null)
                ? gradeService.getGradesForStudentBySemester(studentId, semester)
                : gradeService.getGradesForStudent(studentId);
        return ResponseEntity.ok(grades);
    }

    /** Admin fetches module configs for their department */
    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<GradeConfigDTO>> getConfig(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester,
            @AuthenticationPrincipal User user) {
        String dept = (user.getRole() == Role.SUPER_ADMIN && department != null)
                ? department : user.getDepartment();
        return ResponseEntity.ok(gradeService.getConfigs(dept, semester));
    }

    /** Admin saves (upsert) module configs for their department */
    @PutMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<GradeConfigDTO>> saveConfig(
            @RequestBody List<GradeConfigDTO> dtos,
            @AuthenticationPrincipal User user) {
        String dept = user.getRole() == Role.SUPER_ADMIN
                ? (dtos.isEmpty() ? user.getDepartment() : dtos.get(0).getDepartment())
                : user.getDepartment();
        return ResponseEntity.ok(gradeService.saveConfigs(dtos, dept));
    }

    /** Student fetches all module configs for their department (to display empty rows before entering grades) */
    @GetMapping("/subjects")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GradeConfigDTO>> getMySubjects(
            @RequestParam(required = false) Integer semester,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gradeService.getConfigs(user.getDepartment(), semester));
    }

    @PostMapping("/simulate")
    public ResponseEntity<SimulationResult> simulate(@RequestBody SimulationRequest request) {
        return ResponseEntity.ok(gradeService.simulateFull(request));
    }
}
