package com.unigate.registration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SkillSwapStatsDTO {
    private long activeOffers;
    private long activeMatches;
    private long completedSwaps;
    private double averageRating;
}
