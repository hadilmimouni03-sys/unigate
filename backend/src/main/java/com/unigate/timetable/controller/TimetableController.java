package com.unigate.timetable.controller;

import com.unigate.timetable.dto.TimetableSlotDTO;
import com.unigate.timetable.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<TimetableSlotDTO>> byGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(timetableService.getByGroup(groupId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<TimetableSlotDTO>> byCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(timetableService.getByCourse(courseId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TimetableSlotDTO> create(@RequestBody TimetableSlotDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(timetableService.createSlot(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        timetableService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }
}
