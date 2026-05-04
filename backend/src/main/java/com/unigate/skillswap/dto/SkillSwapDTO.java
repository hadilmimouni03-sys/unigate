package com.unigate.skillswap.dto;

import com.unigate.skillswap.enums.SwapStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SkillSwapDTO {
    private Long id;
    private Long requesterOfferId;
    private String requesterName;
    private Long providerOfferId;
    private String providerName;
    private SwapStatus status;
    private double matchScore;
    private String message;
    private String responseMessage;
    private LocalDateTime createdAt;
}
