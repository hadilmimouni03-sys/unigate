package com.unigate.registration.repository;

import com.unigate.registration.entity.Application;
import com.unigate.registration.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Optional<Application> findByStudentId(Long studentId);
    List<Application> findByStatus(ApplicationStatus status);
    List<Application> findByReviewerId(Long reviewerId);

    @Query("SELECT a FROM Application a JOIN a.student s WHERE s.department = :department")
    List<Application> findByStudentDepartment(@Param("department") String department);

    @Query("SELECT a FROM Application a JOIN a.student s WHERE a.status = :status AND s.department = :department")
    List<Application> findByStatusAndStudentDepartment(@Param("status") ApplicationStatus status, @Param("department") String department);

    @Query("SELECT a FROM Application a WHERE a.status = 'UNDER_REVIEW' AND a.reviewStartedAt < :cutoff")
    List<Application> findSlaBreached(@Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.reviewer.id = :rid AND a.status IN ('SUBMITTED','UNDER_REVIEW','INCOMPLETE')")
    long countActiveByReviewer(@Param("rid") Long rid);

    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.student")
    List<Application> findAllWithStudents();
}
