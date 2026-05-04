package com.unigate.notification.repository;

import com.unigate.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(Long recipientId);
    long countByRecipientIdAndReadFalse(Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientId = :recipientId AND n.read = false")
    void markAllReadForRecipient(Long recipientId);
}
