package com.unigate.grades.entity;

import com.unigate.registration.entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_grades",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "module_code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentGrade {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_config_id", nullable = false)
    private GradeConfig gradeConfig;

    private Double ccMark;
    private Double examMark;
    private Double tpMark;
    private Double finalMark;
    private Boolean passed;
    private String requiredExamToPass;

    /** True when an admin entered this grade — students cannot overwrite admin-entered grades. */
    @Builder.Default private boolean adminEntered = false;

    @Column(updatable = false)
    private LocalDateTime enteredAt;

    @PrePersist protected void onCreate() { enteredAt = LocalDateTime.now(); }
}
