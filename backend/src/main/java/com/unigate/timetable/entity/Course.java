package com.unigate.timetable.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true) private String code;
    @Column(nullable = false) private String name;
    private String department;
    private int credits;
}
