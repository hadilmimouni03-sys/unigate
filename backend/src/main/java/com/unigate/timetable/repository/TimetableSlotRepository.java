package com.unigate.timetable.repository;

import com.unigate.timetable.entity.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, Long> {
    List<TimetableSlot> findByClassGroupIdOrderByDayOfWeekAscStartTimeAsc(Long groupId);
    List<TimetableSlot> findByCourseIdOrderByDayOfWeekAscStartTimeAsc(Long courseId);
}
