package com.unigate.grades.controller;

import com.unigate.grades.dto.GradeDTO;
import com.unigate.grades.dto.GradeEntryRequest;
import com.unigate.grades.dto.SimulationRequest;
import com.unigate.grades.service.GradeService;
import com.unigate.registration.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<GradeDTO> enterGrade(@Valid @RequestBody GradeEntryRequest request) {
        return ResponseEntity.ok(gradeService.enterGrade(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GradeDTO>> myGrades(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gradeService.getGradesForStudent(user.getId()));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<GradeDTO>> studentGrades(@PathVariable Long studentId,
                                                          @RequestParam(required = false) Integer semester) {
        List<GradeDTO> grades = (semester != null)
                ? gradeService.getGradesForStudentBySemester(studentId, semester)
                : gradeService.getGradesForStudent(studentId);
        return ResponseEntity.ok(grades);
    }

    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulate(@Valid @RequestBody SimulationRequest request) {
        return ResponseEntity.ok(gradeService.simulate(
                request.getModuleCode(), request.getCcMark(), request.getExamMark()));
    }
}
