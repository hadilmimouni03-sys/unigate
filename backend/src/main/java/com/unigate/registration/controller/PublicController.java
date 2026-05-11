package com.unigate.registration.controller;

import com.unigate.registration.enums.Role;
import com.unigate.registration.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final UserRepository userRepository;

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getDepartments() {
        List<String> departments = userRepository.findByRole(Role.ADMIN).stream()
                .map(u -> u.getDepartment())
                .filter(Objects::nonNull)
                .filter(d -> !d.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        return ResponseEntity.ok(departments);
    }
}
