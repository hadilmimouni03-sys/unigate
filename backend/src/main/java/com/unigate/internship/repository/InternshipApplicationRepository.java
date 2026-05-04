package com.unigate.internship.repository;

import com.unigate.internship.entity.InternshipApplication;
import com.unigate.internship.enums.ApplicationInternshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InternshipApplicationRepository extends JpaRepository<InternshipApplication, Long> {
    List<InternshipApplication> findByStudentId(Long studentId);
    List<InternshipApplication> findByOfferId(Long offerId);
    List<InternshipApplication> findByOfferIdAndStatus(Long offerId, ApplicationInternshipStatus status);
    boolean existsByStudentIdAndOfferId(Long studentId, Long offerId);
}
