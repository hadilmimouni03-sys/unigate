package com.unigate.registration.entity;

import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.RegistrationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private RegistrationType registrationType;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private ApplicationStatus status;

    @Column(columnDefinition = "TEXT") private String reviewerComment;
    @Column(columnDefinition = "TEXT") private String refusalReason;

    private LocalDateTime submittedAt;
    private LocalDateTime reviewStartedAt;
    private LocalDateTime decidedAt;

    @Column(updatable = false) private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Document> documents = new ArrayList<>();

    @PrePersist protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
