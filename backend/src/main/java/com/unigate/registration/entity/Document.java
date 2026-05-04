package com.unigate.registration.entity;

import com.unigate.registration.enums.DocumentStatus;
import com.unigate.registration.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private DocumentType type;

    @Column(nullable = false) private String fileName;
    @Column(nullable = false) private String filePath;
    private String contentType;
    private Long fileSize;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(columnDefinition = "TEXT") private String validationMessage;
    @Column(columnDefinition = "TEXT") private String reviewerAnnotation;

    @Column(updatable = false) private LocalDateTime uploadedAt;
    private LocalDateTime validatedAt;

    @PrePersist protected void onCreate() { uploadedAt = LocalDateTime.now(); }
}
