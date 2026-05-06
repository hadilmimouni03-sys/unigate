package com.unigate.internship.entity;

import com.unigate.internship.enums.OfferStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "internship_offers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Offer {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String description;
    private String requiredDepartment;
    private String requiredSpeciality;
    private String internshipType;
    private String targetYear;
    private int durationMonths;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private OfferStatus status = OfferStatus.DRAFT;

    private LocalDate applicationDeadline;

    @Column(updatable = false) private LocalDateTime createdAt;
    private LocalDateTime publishedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
