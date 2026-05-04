package com.unigate.internship.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Interview {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private InternshipApplication application;

    @Column(nullable = false) private LocalDateTime scheduledAt;
    private String location; // can be a URL for virtual
    private String notes;

    @Column(updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
