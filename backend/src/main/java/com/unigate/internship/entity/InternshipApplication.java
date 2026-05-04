package com.unigate.internship.entity;

import com.unigate.internship.enums.ApplicationInternshipStatus;
import com.unigate.registration.entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "internship_applications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "offer_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InternshipApplication {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private ApplicationInternshipStatus status = ApplicationInternshipStatus.PENDING;

    @Column(columnDefinition = "TEXT") private String coverLetter;
    private String cvFilePath;
    private String cvFileName;
    @Column(columnDefinition = "TEXT") private String adminNote;

    @Column(updatable = false) private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    @PrePersist  protected void onCreate()  { appliedAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate   protected void onUpdate()  { updatedAt = LocalDateTime.now(); }
}
