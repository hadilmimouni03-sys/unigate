package com.unigate.timetable.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimetableSlotDTO {
    private Long id;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long groupId;
    private String groupName;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private String instructor;
    private String slotType;
}
