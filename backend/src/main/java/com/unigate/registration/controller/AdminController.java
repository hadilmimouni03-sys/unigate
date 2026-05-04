package com.unigate.registration.controller;

import com.unigate.registration.dto.ApplicationDTO;
import com.unigate.registration.dto.ReviewRequest;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ApplicationService applicationService;

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<ApplicationDTO>> listAll(
            @RequestParam(required = false) ApplicationStatus status) {
        List<ApplicationDTO> result = (status != null)
                ? applicationService.getByStatus(status)
                : applicationService.getAll();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/applications/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApplicationDTO> review(@PathVariable Long id,
                                                  @Valid @RequestBody ReviewRequest request) throws Exception {
        return ResponseEntity.ok(applicationService.review(id, request));
    }
}
