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

    /** Continuous assessment mark (0-20) */
    private Double ccMark;
    /** Final exam mark (0-20) */
    private Double examMark;
    /** Computed final mark: ccWeight*cc + examWeight*exam */
    private Double finalMark;
    /** True when student passes (finalMark >= 10) */
    private Boolean passed;

    @Column(updatable = false)
    private LocalDateTime enteredAt;

    @PrePersist protected void onCreate() { enteredAt = LocalDateTime.now(); }
}
