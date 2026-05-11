package com.unigate.skillswap.entity;

import com.unigate.registration.entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "skill_offers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SkillOffer {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToMany
    @JoinTable(name = "skill_offer_skills",
               joinColumns = @JoinColumn(name = "offer_id"),
               inverseJoinColumns = @JoinColumn(name = "skill_id"))
    @Builder.Default
    private Set<Skill> skillsOffered = new HashSet<>();

    @ManyToMany
    @JoinTable(name = "skill_offer_wanted",
               joinColumns = @JoinColumn(name = "offer_id"),
               inverseJoinColumns = @JoinColumn(name = "skill_id"))
    @Builder.Default
    private Set<Skill> skillsWanted = new HashSet<>();

    @Column(columnDefinition = "TEXT") private String description;
    private String availability; 
    private boolean active;

    @Column(updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); active = true; }
}
