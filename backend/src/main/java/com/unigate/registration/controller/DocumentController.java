package com.unigate.registration.controller;

import com.unigate.registration.dto.AnnotateDocumentRequest;
import com.unigate.registration.dto.DocumentDTO;
import com.unigate.registration.enums.DocumentType;
import com.unigate.registration.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<DocumentDTO> upload(@RequestParam Long applicationId,
                                               @RequestParam DocumentType type,
                                               @RequestParam MultipartFile file) throws IOException {
        return ResponseEntity.ok(documentService.upload(applicationId, type, file));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyRole('STUDENT','SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<DocumentDTO>> listForApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(documentService.getForApplication(applicationId));
    }

    @PatchMapping("/{id}/annotate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<DocumentDTO> annotate(@PathVariable Long id,
                                                 @Valid @RequestBody AnnotateDocumentRequest request) {
        return ResponseEntity.ok(documentService.annotate(id, request.getAnnotation()));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('STUDENT','SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        Path filePath = documentService.getFilePath(id);
        Resource resource = new PathResource(filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filePath.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
