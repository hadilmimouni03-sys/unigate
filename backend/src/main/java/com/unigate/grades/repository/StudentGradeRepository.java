package com.unigate.grades.repository;

import com.unigate.grades.entity.StudentGrade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentGradeRepository extends JpaRepository<StudentGrade, Long> {
    List<StudentGrade> findByStudentId(Long studentId);
    Optional<StudentGrade> findByStudentIdAndGradeConfigModuleCode(Long studentId, String moduleCode);
    List<StudentGrade> findByStudentIdAndGradeConfigSemester(Long studentId, int semester);
}
