package com.unigate.registration.repository;

import com.unigate.registration.entity.Student;
import com.unigate.registration.enums.RegistrationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByEmail(String email);
    List<Student> findByRegistrationType(RegistrationType type);
    List<Student> findByDepartment(String department);
}
