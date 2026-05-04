package com.unigate.skillswap.entity;

import com.unigate.registration.entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "swap_ratings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SwapRating {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "swap_id", nullable = false)
    private SkillSwap swap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id", nullable = false)
    private Student rater;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ratee_id", nullable = false)
    private Student ratee;

    private int score; // 1-5
    @Column(columnDefinition = "TEXT") private String comment;

    @Column(updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
