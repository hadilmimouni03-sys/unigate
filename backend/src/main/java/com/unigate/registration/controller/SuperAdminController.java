package com.unigate.registration.controller;

import com.unigate.registration.dto.*;
import com.unigate.registration.entity.Application;
import com.unigate.registration.entity.RegistrationPeriod;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.PeriodStatus;
import com.unigate.registration.enums.Role;
import com.unigate.registration.repository.ApplicationRepository;
import com.unigate.registration.repository.RegistrationPeriodRepository;
import com.unigate.registration.repository.UserRepository;
import com.unigate.skillswap.enums.SwapStatus;
import com.unigate.skillswap.repository.SkillOfferRepository;
import com.unigate.skillswap.repository.SkillSwapRepository;
import com.unigate.skillswap.repository.SwapRatingRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SuperAdminController {

    private final UserRepository              userRepository;
    private final ApplicationRepository       applicationRepository;
    private final RegistrationPeriodRepository registrationPeriodRepository;
    private final SkillSwapRepository         skillSwapRepository;
    private final SkillOfferRepository        skillOfferRepository;
    private final SwapRatingRepository        swapRatingRepository;
    private final PasswordEncoder             passwordEncoder;

    // ── Admin Users ───────────────────────────────────────────────────────────

    @GetMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AdminUserDTO>> getAdmins() {
        return ResponseEntity.ok(
            userRepository.findByRole(Role.ADMIN).stream()
                .map(this::toAdminDTO)
                .collect(Collectors.toList())
        );
    }

    @PostMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> createAdmin(@Valid @RequestBody CreateAdminRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        User admin = User.builder()
            .firstName(req.getFirstName())
            .lastName(req.getLastName())
            .email(req.getEmail())
            .password(passwordEncoder.encode(req.getPassword()))
            .role(Role.ADMIN)
            .department(req.getDepartment())
            .build();
        return ResponseEntity.ok(toAdminDTO(userRepository.save(admin)));
    }

    // ── Department Stats ──────────────────────────────────────────────────────

    @GetMapping("/departments")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<DepartmentStatsDTO>> getDepartmentStats() {
        List<Application> apps  = applicationRepository.findAllWithStudents();
        List<User>        admins = userRepository.findByRole(Role.ADMIN);

        Map<String, Long> adminsByDept = admins.stream()
            .filter(u -> u.getDepartment() != null)
            .collect(Collectors.groupingBy(User::getDepartment, Collectors.counting()));

        Map<String, List<Application>> appsByDept = apps.stream()
            .filter(a -> a.getStudent() != null && a.getStudent().getDepartment() != null)
            .collect(Collectors.groupingBy(a -> a.getStudent().getDepartment()));

        Set<String> allDepts = new LinkedHashSet<>();
        allDepts.addAll(adminsByDept.keySet());
        allDepts.addAll(appsByDept.keySet());

        List<DepartmentStatsDTO> result = allDepts.stream().map(dept -> {
            List<Application> deptApps = appsByDept.getOrDefault(dept, List.of());
            long approved    = countByStatus(deptApps, ApplicationStatus.APPROVED);
            long submitted   = countByStatus(deptApps, ApplicationStatus.SUBMITTED);
            long underReview = countByStatus(deptApps, ApplicationStatus.UNDER_REVIEW);
            long refused     = countByStatus(deptApps, ApplicationStatus.REFUSED);
            long processed   = approved + refused;
            int  sla         = deptApps.isEmpty() ? 100
                : (int) Math.round(processed * 100.0 / deptApps.size());

            return DepartmentStatsDTO.builder()
                .name(dept)
                .totalApplications(deptApps.size())
                .enrolled((int) approved)
                .pending((int) submitted)
                .underReview((int) underReview)
                .refused((int) refused)
                .slaCompliance(sla)
                .adminCount(adminsByDept.getOrDefault(dept, 0L).intValue())
                .build();
        }).sorted(Comparator.comparing(DepartmentStatsDTO::getName))
          .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ── Skill Swap Stats ──────────────────────────────────────────────────────

    @GetMapping("/skillswap-stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SkillSwapStatsDTO> getSkillSwapStats() {
        long activeOffers   = skillOfferRepository.findByActiveTrueOrderByCreatedAtDesc().size();
        long activeMatches  = skillSwapRepository.findByStatus(SwapStatus.ACCEPTED).size();
        long completedSwaps = skillSwapRepository.findByStatus(SwapStatus.COMPLETED).size();
        Double avg          = swapRatingRepository.findOverallAverageScore();
        double averageRating = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;

        return ResponseEntity.ok(SkillSwapStatsDTO.builder()
            .activeOffers(activeOffers)
            .activeMatches(activeMatches)
            .completedSwaps(completedSwaps)
            .averageRating(averageRating)
            .build());
    }

    // ── Registration Periods ──────────────────────────────────────────────────

    @GetMapping("/registration-periods")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<RegistrationPeriodDTO>> getRegistrationPeriods() {
        List<Application> apps = applicationRepository.findAll();
        return ResponseEntity.ok(
            registrationPeriodRepository.findAllByOrderByStartDateDesc()
                .stream().map(p -> toPeriodDTO(p, apps))
                .collect(Collectors.toList())
        );
    }

    @PostMapping("/registration-periods")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<RegistrationPeriodDTO> createRegistrationPeriod(
            @Valid @RequestBody CreateRegistrationPeriodRequest req) {
        RegistrationPeriod period = RegistrationPeriod.builder()
            .name(req.getName())
            .startDate(req.getStartDate())
            .endDate(req.getEndDate())
            .status(PeriodStatus.ACTIVE)
            .build();
        return ResponseEntity.ok(toPeriodDTO(registrationPeriodRepository.save(period), List.of()));
    }

    @PatchMapping("/registration-periods/{id}/close")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<RegistrationPeriodDTO> closeRegistrationPeriod(@PathVariable Long id) {
        RegistrationPeriod period = registrationPeriodRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Registration period not found: " + id));
        period.setStatus(PeriodStatus.CLOSED);
        return ResponseEntity.ok(toPeriodDTO(registrationPeriodRepository.save(period),
            applicationRepository.findAll()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AdminUserDTO toAdminDTO(User u) {
        List<Application> reviewed  = applicationRepository.findByReviewerId(u.getId());
        int reviewedCount = (int) reviewed.stream()
            .filter(a -> a.getStatus() == ApplicationStatus.APPROVED
                      || a.getStatus() == ApplicationStatus.REFUSED)
            .count();
        int pendingCount  = (int) reviewed.stream()
            .filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED
                      || a.getStatus() == ApplicationStatus.UNDER_REVIEW)
            .count();
        return AdminUserDTO.builder()
            .id(u.getId())
            .firstName(u.getFirstName())
            .lastName(u.getLastName())
            .email(u.getEmail())
            .department(u.getDepartment())
            .reviewedCount(reviewedCount)
            .pendingCount(pendingCount)
            .build();
    }

    private RegistrationPeriodDTO toPeriodDTO(RegistrationPeriod p, List<Application> allApps) {
        long count = allApps.stream()
            .filter(a -> a.getSubmittedAt() != null
                && !a.getSubmittedAt().toLocalDate().isBefore(p.getStartDate())
                && !a.getSubmittedAt().toLocalDate().isAfter(p.getEndDate()))
            .count();
        return RegistrationPeriodDTO.builder()
            .id(p.getId())
            .name(p.getName())
            .startDate(p.getStartDate())
            .endDate(p.getEndDate())
            .status(p.getStatus().name())
            .totalApplications(count)
            .build();
    }

    private static long countByStatus(List<Application> apps, ApplicationStatus status) {
        return apps.stream().filter(a -> a.getStatus() == status).count();
    }
}
