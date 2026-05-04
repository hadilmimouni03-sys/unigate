package com.unigate.notification.listener;

import com.unigate.notification.event.NewOfferPublishedEvent;
import com.unigate.notification.service.NotificationService;
import com.unigate.registration.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NewOfferPublishedListener {

    private final NotificationService notificationService;
    private final StudentRepository studentRepository;

    @Async
    @EventListener
    public void onOfferPublished(NewOfferPublishedEvent event) {
        studentRepository.findAll().forEach(student ->
            notificationService.send(
                    student.getId(),
                    "New internship offer",
                    "\"" + event.getOfferTitle() + "\" at " + event.getCompany() + " is now available.",
                    "NEW_OFFER"
            )
        );
    }
}
