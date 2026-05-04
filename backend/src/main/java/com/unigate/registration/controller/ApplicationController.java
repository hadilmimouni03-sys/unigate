package com.unigate.registration.controller;

import com.unigate.registration.dto.ApplicationDTO;
import com.unigate.registration.entity.User;
import com.unigate.registration.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApplicationDTO> myApplication(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.createOrGetApplication(user.getId()));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApplicationDTO> submit(@PathVariable Long id,
                                                  @AuthenticationPrincipal User user) throws Exception {
        return ResponseEntity.ok(applicationService.submit(id, user.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApplicationDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getById(id));
    }
}
