package com.unigate.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String actorEmail;
    @Column(nullable = false) private String actorRole;
    @Column(nullable = false) private String action;
    private String entityType;
    private Long entityId;
    @Column(columnDefinition = "TEXT") private String details;

    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
