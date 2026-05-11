package com.unigate.skillswap.repository;

import com.unigate.skillswap.entity.SwapRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SwapRatingRepository extends JpaRepository<SwapRating, Long> {
    List<SwapRating> findByRateeId(Long rateeId);

    int countByRateeId(Long rateeId);

    @Query("SELECT AVG(r.score) FROM SwapRating r WHERE r.ratee.id = :rateeId")
    Double findAverageScoreByRateeId(Long rateeId);

    @Query("SELECT AVG(r.score) FROM SwapRating r")
    Double findOverallAverageScore();
}
