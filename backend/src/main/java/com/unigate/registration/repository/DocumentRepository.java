package com.unigate.registration.repository;

import com.unigate.registration.entity.Document;
import com.unigate.registration.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByApplicationId(Long applicationId);
    Optional<Document> findByApplicationIdAndType(Long applicationId, DocumentType type);
}
