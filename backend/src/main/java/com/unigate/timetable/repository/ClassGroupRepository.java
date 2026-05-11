package com.unigate.timetable.repository;

import com.unigate.timetable.entity.ClassGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, Long> {
    List<ClassGroup> findByDepartmentAndYear(String department, int year);
    Optional<ClassGroup> findFirstByDepartmentOrderByNameAsc(String department);
    Optional<ClassGroup> findFirstByDepartmentAndYearOrderByNameAsc(String department, int year);
}
