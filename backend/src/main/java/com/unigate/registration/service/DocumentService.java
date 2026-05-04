package com.unigate.registration.service;

import com.unigate.exception.BusinessException;
import com.unigate.exception.ResourceNotFoundException;
import com.unigate.registration.dto.DocumentDTO;
import com.unigate.registration.entity.Application;
import com.unigate.registration.entity.Document;
import com.unigate.registration.enums.DocumentStatus;
import com.unigate.registration.enums.DocumentType;
import com.unigate.registration.repository.ApplicationRepository;
import com.unigate.registration.repository.DocumentRepository;
import com.unigate.registration.validation.DocumentValidator;
import com.unigate.registration.validation.DocumentValidatorFactory;
import com.unigate.registration.event.DocumentUploadedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ApplicationRepository applicationRepository;
    private final DocumentValidatorFactory validatorFactory;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional
    public DocumentDTO upload(Long applicationId, DocumentType type, MultipartFile file) throws IOException {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));

        String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path dir = Paths.get(uploadDir, String.valueOf(applicationId));
        Files.createDirectories(dir);
        Path filePath = dir.resolve(storedName);
        Files.copy(file.getInputStream(), filePath);

        Document doc = Document.builder()
                .application(app)
                .type(type)
                .fileName(file.getOriginalFilename())
                .filePath(filePath.toString())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .status(DocumentStatus.PENDING)
                .build();
        doc = documentRepository.save(doc);

        eventPublisher.publishEvent(new DocumentUploadedEvent(this, doc));
        validateAsync(doc.getId());

        return toDTO(doc);
    }

    @Async
    @Transactional
    public void validateAsync(Long documentId) {
        documentRepository.findById(documentId).ifPresent(doc -> {
            DocumentValidator validator = validatorFactory.getValidator(doc.getType());
            DocumentValidator.ValidationResult result = validator.validate(doc);
            doc.setStatus(result.isValid() ? DocumentStatus.VALID : DocumentStatus.INVALID);
            doc.setValidationMessage(result.getMessage());
            doc.setValidatedAt(java.time.LocalDateTime.now());
            documentRepository.save(doc);
        });
    }

    @Transactional
    public DocumentDTO annotate(Long documentId, String annotation) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));
        doc.setReviewerAnnotation(annotation);
        doc.setStatus(DocumentStatus.NEEDS_CORRECTION);
        return toDTO(documentRepository.save(doc));
    }

    @Transactional(readOnly = true)
    public List<DocumentDTO> getForApplication(Long applicationId) {
        return documentRepository.findByApplicationId(applicationId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Path getFilePath(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));
        return Paths.get(doc.getFilePath());
    }

    private DocumentDTO toDTO(Document doc) {
        return DocumentDTO.builder()
                .id(doc.getId())
                .type(doc.getType())
                .fileName(doc.getFileName())
                .status(doc.getStatus())
                .validationMessage(doc.getValidationMessage())
                .reviewerAnnotation(doc.getReviewerAnnotation())
                .uploadedAt(doc.getUploadedAt())
                .downloadUrl("/api/documents/" + doc.getId() + "/download")
                .build();
    }
}
