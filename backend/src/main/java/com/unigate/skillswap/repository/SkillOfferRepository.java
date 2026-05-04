package com.unigate.skillswap.repository;

import com.unigate.skillswap.entity.SkillOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SkillOfferRepository extends JpaRepository<SkillOffer, Long> {
    Optional<SkillOffer> findByStudentIdAndActiveTrue(Long studentId);
    List<SkillOffer> findByActiveTrueOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT o FROM SkillOffer o JOIN o.skillsOffered s WHERE s.id IN :skillIds AND o.active = true")
    List<SkillOffer> findActiveOffersWithSkills(java.util.Collection<Long> skillIds);
}
