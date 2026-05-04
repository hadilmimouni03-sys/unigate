package com.unigate.notification.service;

import com.unigate.notification.dto.NotificationDTO;
import com.unigate.notification.entity.Notification;
import com.unigate.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void send(Long recipientId, String title, String message, String type) {
        Notification notification = notificationRepository.save(
                Notification.builder()
                        .recipientId(recipientId)
                        .title(title)
                        .message(message)
                        .type(type)
                        .build()
        );
        NotificationDTO dto = toDTO(notification);
        messagingTemplate.convertAndSendToUser(recipientId.toString(), "/queue/notifications", dto);
        log.debug("Notification sent to user {} — {}", recipientId, title);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getForUser(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnread(Long recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }

    @Transactional
    public void markAllRead(Long recipientId) {
        notificationRepository.markAllReadForRecipient(recipientId);
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
