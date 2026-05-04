package com.unigate.timetable.service;

import com.unigate.exception.ResourceNotFoundException;
import com.unigate.timetable.dto.TimetableSlotDTO;
import com.unigate.timetable.entity.ClassGroup;
import com.unigate.timetable.entity.Course;
import com.unigate.timetable.entity.TimetableSlot;
import com.unigate.timetable.repository.ClassGroupRepository;
import com.unigate.timetable.repository.CourseRepository;
import com.unigate.timetable.repository.TimetableSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final TimetableSlotRepository slotRepository;
    private final CourseRepository courseRepository;
    private final ClassGroupRepository groupRepository;

    @Transactional(readOnly = true)
    public List<TimetableSlotDTO> getByGroup(Long groupId) {
        return slotRepository.findByClassGroupIdOrderByDayOfWeekAscStartTimeAsc(groupId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TimetableSlotDTO> getByCourse(Long courseId) {
        return slotRepository.findByCourseIdOrderByDayOfWeekAscStartTimeAsc(courseId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public TimetableSlotDTO createSlot(TimetableSlotDTO dto) {
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", dto.getCourseId()));
        ClassGroup group = groupRepository.findById(dto.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("ClassGroup", dto.getGroupId()));

        TimetableSlot slot = TimetableSlot.builder()
                .course(course)
                .classGroup(group)
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .room(dto.getRoom())
                .instructor(dto.getInstructor())
                .slotType(dto.getSlotType())
                .build();
        return toDTO(slotRepository.save(slot));
    }

    @Transactional
    public void deleteSlot(Long id) {
        slotRepository.deleteById(id);
    }

    private TimetableSlotDTO toDTO(TimetableSlot s) {
        return TimetableSlotDTO.builder()
                .id(s.getId())
                .courseId(s.getCourse().getId())
                .courseCode(s.getCourse().getCode())
                .courseName(s.getCourse().getName())
                .groupId(s.getClassGroup().getId())
                .groupName(s.getClassGroup().getName())
                .dayOfWeek(s.getDayOfWeek())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .room(s.getRoom())
                .instructor(s.getInstructor())
                .slotType(s.getSlotType())
                .build();
    }
}
