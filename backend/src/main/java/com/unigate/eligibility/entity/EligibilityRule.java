package com.unigate.eligibility.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "eligibility_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EligibilityRule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String department;
    @Column(nullable = false) private String yearLevel;
    @Column(nullable = false) private String ruleName;
    /** GPA_GTE | CREDITS_GTE | STATUS_EQ */
    @Column(nullable = false) private String conditionType;
    @Column(nullable = false) private String targetValue;
    @Builder.Default private boolean enabled = true;
}
