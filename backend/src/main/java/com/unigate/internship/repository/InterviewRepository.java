package com.unigate.internship.repository;

import com.unigate.internship.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    Optional<Interview> findByApplicationId(Long applicationId);
}
