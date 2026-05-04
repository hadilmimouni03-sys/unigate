package com.unigate.notification.listener;

import com.unigate.notification.event.GradeEnteredEvent;
import com.unigate.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GradeEnteredListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    public void onGradeEntered(GradeEnteredEvent event) {
        notificationService.send(
                event.getStudentId(),
                "New grade available",
                "Your grade for \"" + event.getModuleName() + "\" has been entered: " + event.getGrade() + "/20",
                "GRADE_ENTERED"
        );
    }
}
