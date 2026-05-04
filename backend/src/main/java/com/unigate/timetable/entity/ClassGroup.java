package com.unigate.timetable.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "class_groups")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassGroup {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String name;
    private String department;
    private int year;
    private String semester;
}
