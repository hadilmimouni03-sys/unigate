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

    @Column(nullable = false) private double ccWeight;
    @Column(nullable = false) private double examWeight;
    @Builder.Default private double tpWeight = 0.0;

    private int credits;
    private int semester;

    private String parentModuleName;
}
