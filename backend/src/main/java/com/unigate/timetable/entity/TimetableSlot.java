package com.unigate.timetable.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "timetable_slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TimetableSlot {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ClassGroup classGroup;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false) private LocalTime startTime;
    @Column(nullable = false) private LocalTime endTime;
    private String room;
    private String instructor;
    private String slotType; 
}
