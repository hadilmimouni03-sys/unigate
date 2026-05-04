package com.unigate.notification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class GradeEnteredEvent extends ApplicationEvent {

    private final Long studentId;
    private final String moduleName;
    private final double grade;

    public GradeEnteredEvent(Object source, Long studentId, String moduleName, double grade) {
        super(source);
        this.studentId = studentId;
        this.moduleName = moduleName;
        this.grade = grade;
    }
}
