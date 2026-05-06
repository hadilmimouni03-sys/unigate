package com.unigate.eligibility.controller;

import com.unigate.eligibility.dto.EligibilityRuleDTO;
import com.unigate.eligibility.service.EligibilityService;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eligibility")
@RequiredArgsConstructor
public class EligibilityController {

    private final EligibilityService eligibilityService;

    @GetMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<EligibilityRuleDTO>> getRules(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String yearLevel,
            @AuthenticationPrincipal User user) {
        String dept = (user.getRole() == Role.SUPER_ADMIN && department != null)
                ? department : user.getDepartment();
        return ResponseEntity.ok(eligibilityService.getRules(dept, yearLevel));
    }

    @PutMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<EligibilityRuleDTO>> saveRules(
            @RequestParam String yearLevel,
            @RequestBody List<EligibilityRuleDTO> rules,
            @AuthenticationPrincipal User user) {
        String dept = user.getRole() == Role.SUPER_ADMIN
                ? (rules.isEmpty() ? user.getDepartment() : rules.get(0).getDepartment())
                : user.getDepartment();
        return ResponseEntity.ok(eligibilityService.saveRules(dept, yearLevel, rules));
    }
}
