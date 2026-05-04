package com.unigate.skillswap.repository;

import com.unigate.skillswap.entity.SkillSwap;
import com.unigate.skillswap.enums.SwapStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SkillSwapRepository extends JpaRepository<SkillSwap, Long> {
    @Query("SELECT s FROM SkillSwap s WHERE s.requesterOffer.student.id = :studentId OR s.providerOffer.student.id = :studentId")
    List<SkillSwap> findByStudentId(Long studentId);

    List<SkillSwap> findByStatus(SwapStatus status);
}
