package com.unigate.notification.listener;

import com.unigate.notification.service.NotificationService;
import com.unigate.registration.event.DocumentUploadedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DocumentUploadedListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    public void onDocumentUploaded(DocumentUploadedEvent event) {
        var doc = event.getDocument();
        Long studentId = doc.getApplication().getStudent().getId();
        notificationService.send(
                studentId,
                "Document received",
                "Your document \"" + doc.getType().name() + "\" has been uploaded and is pending review.",
                "DOCUMENT_UPLOADED"
        );
    }
}
