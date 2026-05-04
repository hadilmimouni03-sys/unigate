package com.unigate.notification.listener;

import com.unigate.notification.service.NotificationService;
import com.unigate.registration.event.ApplicationStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicationStatusChangedListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    public void onStatusChanged(ApplicationStatusChangedEvent event) {
        var app = event.getApplication();
        Long studentId = app.getStudent().getId();
        String msg = buildMessage(event);
        notificationService.send(
                studentId,
                "Application status update",
                msg,
                "APPLICATION_STATUS"
        );
    }

    private String buildMessage(ApplicationStatusChangedEvent event) {
        return switch (event.getNewStatus()) {
            case SUBMITTED -> "Your application has been submitted successfully.";
            case UNDER_REVIEW -> "Your application is now under review by an academic reviewer.";
            case INCOMPLETE -> "Your application has been marked incomplete. Please review the comments and resubmit.";
            case APPROVED -> "Congratulations! Your application has been approved.";
            case REFUSED -> "Your application has been refused. Please contact the administration for more details.";
            default -> "Your application status has changed to " + event.getNewStatus().name();
        };
    }
}
