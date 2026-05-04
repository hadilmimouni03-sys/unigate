package com.unigate.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long recipientId;
    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT", nullable = false) private String message;
    @Column(nullable = false) private String type;

    @Builder.Default
    private boolean read = false;

    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
