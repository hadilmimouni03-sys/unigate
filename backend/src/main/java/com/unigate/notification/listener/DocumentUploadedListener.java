package com.unigate.notification.listener;

import com.unigate.eligibility.service.EligibilityService;
import com.unigate.notification.service.NotificationService;
import com.unigate.registration.entity.Document;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import com.unigate.registration.event.DocumentUploadedEvent;
import com.unigate.registration.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DocumentUploadedListener {

    private final NotificationService notificationService;
    private final EligibilityService eligibilityService;
    private final UserRepository userRepository;

    @Async
    @EventListener
    public void onDocumentUploaded(DocumentUploadedEvent event) {
        Document doc = event.getDocument();
        Long studentId = doc.getApplication().getStudent().getId();
        String studentName = doc.getApplication().getStudent().getFullName();
        String department = doc.getApplication().getStudent().getDepartment();

        // 1. Notify student: document received
        notificationService.send(
                studentId,
                "Document received",
                "Your document \"" + doc.getType().name() + "\" has been uploaded and is pending review.",
                "DOCUMENT_UPLOADED");

        // 2. Check eligibility rules
        List<String> violations = eligibilityService.checkStudent(studentId);
        if (violations.isEmpty()) return;

        String violationText = String.join(", ", violations);

        // 3a. Warn the student
        notificationService.send(
                studentId,
                "Eligibility Warning",
                "You uploaded a document but may not meet eligibility requirements: " + violationText,
                "SYSTEM");

        // 3b. Alert all admins in this department
        if (department != null) {
            userRepository.findByRoleAndDepartment(Role.ADMIN, department).forEach(admin ->
                notificationService.send(
                        admin.getId(),
                        "Eligibility Alert — " + studentName,
                        studentName + " uploaded a document but failed: " + violationText,
                        "SYSTEM")
            );
        }
    }
}
