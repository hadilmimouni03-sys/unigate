package com.unigate.internship.controller;

import com.unigate.internship.dto.InternshipApplicationDTO;
import com.unigate.internship.dto.OfferDTO;
import com.unigate.internship.enums.ApplicationInternshipStatus;
import com.unigate.internship.repository.InternshipApplicationRepository;
import com.unigate.internship.service.InternshipService;
import com.unigate.registration.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/internships")
@RequiredArgsConstructor
public class InternshipController {

    private final InternshipService internshipService;
    private final InternshipApplicationRepository applicationRepository;

    @GetMapping("/offers")
    public ResponseEntity<List<OfferDTO>> listOffers(
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(internshipService.getPublishedOffers(department));
    }

    @GetMapping("/offers/admin")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<OfferDTO>> listAllOffers() {
        return ResponseEntity.ok(internshipService.getAllOffers());
    }

    @PostMapping("/offers")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<OfferDTO> createOffer(@RequestBody OfferDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(internshipService.createOffer(dto));
    }

    @PostMapping("/offers/{offerId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<OfferDTO> publish(@PathVariable Long offerId) {
        return ResponseEntity.ok(internshipService.publishOffer(offerId));
    }

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<InternshipApplicationDTO> apply(
            @RequestParam Long offerId,
            @RequestParam(required = false) String coverLetter,
            @RequestParam(required = false) MultipartFile cv,
            @AuthenticationPrincipal User user) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(internshipService.apply(user.getId(), offerId, coverLetter, cv));
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<InternshipApplicationDTO>> myApplications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(internshipService.getMyApplications(user.getId()));
    }

    @GetMapping("/offers/{offerId}/applications")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<InternshipApplicationDTO>> applicationsForOffer(@PathVariable Long offerId) {
        return ResponseEntity.ok(internshipService.getApplicationsForOffer(offerId));
    }

    @PatchMapping("/applications/{appId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<InternshipApplicationDTO> updateStatus(
            @PathVariable Long appId,
            @RequestBody Map<String, String> body) {
        ApplicationInternshipStatus status = ApplicationInternshipStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(internshipService.updateStatus(appId, status, body.get("note")));
    }

    @GetMapping("/applications/{appId}/cv")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long appId) throws IOException {
        var app = applicationRepository.findById(appId)
                .orElseThrow(() -> new com.unigate.exception.ResourceNotFoundException("InternshipApplication", appId));
        if (app.getCvFilePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = Path.of(app.getCvFilePath());
        Resource resource = new PathResource(filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + app.getCvFileName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }
}
