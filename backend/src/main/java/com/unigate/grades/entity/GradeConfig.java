package com.unigate.grades.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grade_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeConfig {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true) private String moduleCode;
    @Column(nullable = false) private String moduleName;
    private String department;

    /** CC weight as a fraction (e.g. 0.4 for 40%) */
    @Column(nullable = false) private double ccWeight;
    /** Exam weight as a fraction (e.g. 0.6 for 60%) */
    @Column(nullable = false) private double examWeight;

    private int credits;
    private int semester;
}
