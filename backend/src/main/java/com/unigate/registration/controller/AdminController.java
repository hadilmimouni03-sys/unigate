package com.unigate.registration.controller;

import com.unigate.registration.dto.ApplicationDTO;
import com.unigate.registration.dto.ReviewRequest;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.Role;
import com.unigate.registration.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
            @RequestParam(required = false) ApplicationStatus status,
            @AuthenticationPrincipal User user) {

        boolean isSuperAdmin = user.getRole() == Role.SUPER_ADMIN;
        String dept = user.getDepartment();

        List<ApplicationDTO> result;
        if (isSuperAdmin || dept == null) {
            result = (status != null)
                    ? applicationService.getByStatus(status)
                    : applicationService.getAll();
        } else {
            result = (status != null)
                    ? applicationService.getByStatusAndDepartment(status, dept)
                    : applicationService.getAllByDepartment(dept);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/applications/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApplicationDTO> review(@PathVariable Long id,
                                                  @Valid @RequestBody ReviewRequest request) throws Exception {
        return ResponseEntity.ok(applicationService.review(id, request));
    }
}
