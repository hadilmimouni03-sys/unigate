package com.unigate.grades.repository;

import com.unigate.grades.entity.GradeConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeConfigRepository extends JpaRepository<GradeConfig, Long> {
    Optional<GradeConfig> findByModuleCode(String moduleCode);
    List<GradeConfig> findByModuleCodeIn(List<String> moduleCodes);
    List<GradeConfig> findBySemester(int semester);
    List<GradeConfig> findByDepartment(String department);
    List<GradeConfig> findByDepartmentAndSemester(String department, int semester);
}
