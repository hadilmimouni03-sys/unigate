package com.unigate.skillswap.entity;

import com.unigate.skillswap.enums.SwapStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_swaps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SkillSwap {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_offer_id", nullable = false)
    private SkillOffer requesterOffer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_offer_id", nullable = false)
    private SkillOffer providerOffer;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private SwapStatus status = SwapStatus.PENDING;

    private double matchScore;

    @Column(columnDefinition = "TEXT") private String message;
    @Column(columnDefinition = "TEXT") private String responseMessage;

    @Column(updatable = false) private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime completedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
