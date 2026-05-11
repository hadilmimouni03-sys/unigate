package com.unigate.timetable.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ClassGroupDTO {
    private Long id;
    private String name;
    private String department;
    private int year;
    private String semester;
    private String yearLevel;
}
