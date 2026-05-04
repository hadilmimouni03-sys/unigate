package com.unigate.internship.repository;

import com.unigate.internship.entity.Offer;
import com.unigate.internship.enums.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByStatus(OfferStatus status);
    List<Offer> findByStatusAndRequiredDepartment(OfferStatus status, String department);

    @Query("SELECT o FROM Offer o WHERE o.status = 'PUBLISHED' AND o.applicationDeadline < :today")
    List<Offer> findExpiredOffers(LocalDate today);
}
