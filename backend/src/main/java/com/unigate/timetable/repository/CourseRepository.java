package com.unigate.timetable.repository;

import com.unigate.timetable.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByDepartment(String department);
}
