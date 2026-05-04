package com.unigate.registration.service;

import com.unigate.exception.BusinessException;
import com.unigate.exception.ResourceNotFoundException;
import com.unigate.registration.dto.ApplicationDTO;
import com.unigate.registration.dto.DocumentDTO;
import com.unigate.registration.dto.ReviewRequest;
import com.unigate.registration.entity.Application;
import com.unigate.registration.entity.Student;
import com.unigate.registration.enums.ApplicationEvent;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.DocumentStatus;
import com.unigate.registration.event.ApplicationStatusChangedEvent;
import com.unigate.registration.repository.ApplicationRepository;
import com.unigate.registration.repository.StudentRepository;
import com.unigate.registration.statemachine.ApplicationStateMachineService;
import com.unigate.timetable.entity.ClassGroup;
import com.unigate.timetable.repository.ClassGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final ApplicationStateMachineService stateMachineService;
    private final ApplicationEventPublisher eventPublisher;
    private final ClassGroupRepository classGroupRepository;

    @Transactional
    public ApplicationDTO createOrGetApplication(Long studentId) {
        return applicationRepository.findByStudentId(studentId)
                .map(this::toDTO)
                .orElseGet(() -> {
                    Student student = studentRepository.findById(studentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
                    Application app = Application.builder()
                            .student(student)
                            .registrationType(student.getRegistrationType())
                            .status(ApplicationStatus.DRAFT)
                            .build();
                    return toDTO(applicationRepository.save(app));
                });
    }

    @Transactional
    public ApplicationDTO submit(Long applicationId, Long studentId) throws Exception {
        Application app = getAppOwnedBy(applicationId, studentId);
        if (app.getStatus() != ApplicationStatus.DRAFT && app.getStatus() != ApplicationStatus.INCOMPLETE) {
            throw new BusinessException("Application cannot be submitted from status: " + app.getStatus());
        }
        boolean hasInvalid = app.getDocuments().stream()
                .anyMatch(d -> d.getStatus() == DocumentStatus.INVALID);
        if (hasInvalid) {
            throw new BusinessException("Application has invalid documents. Please re-upload them.");
        }
        ApplicationStatus prev = app.getStatus();
        var sm = stateMachineService.restoreToState(app.getRegistrationType(), app.getStatus());
        ApplicationEvent event = (prev == ApplicationStatus.INCOMPLETE)
                ? ApplicationEvent.RESUBMIT : ApplicationEvent.SUBMIT;
        var newStatus = stateMachineService.sendEvent(sm, event);
        app.setStatus(newStatus);
        app.setSubmittedAt(LocalDateTime.now());
        app = applicationRepository.save(app);
        eventPublisher.publishEvent(new ApplicationStatusChangedEvent(this, app, prev, newStatus));
        return toDTO(app);
    }

    @Transactional
    public ApplicationDTO review(Long applicationId, ReviewRequest request) throws Exception {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));

        ApplicationStatus prev = app.getStatus();
        ApplicationEvent event = switch (request.getAction()) {
            case APPROVE -> ApplicationEvent.APPROVE;
            case REFUSE -> ApplicationEvent.REFUSE;
            case REQUEST_INCOMPLETE -> ApplicationEvent.REQUEST_INCOMPLETE;
        };

        var sm = stateMachineService.restoreToState(app.getRegistrationType(), app.getStatus());
        var newStatus = stateMachineService.sendEvent(sm, event);

        app.setStatus(newStatus);
        app.setReviewerComment(request.getComment());
        if (request.getAction() == ReviewRequest.ReviewAction.REFUSE) {
            app.setRefusalReason(request.getRefusalReason());
        }
        app.setDecidedAt(LocalDateTime.now());
        app = applicationRepository.save(app);

        // Auto-assign student to a ClassGroup on approval
        if (newStatus == ApplicationStatus.APPROVED) {
            autoAssignClassGroup(app.getStudent());
        }

        eventPublisher.publishEvent(new ApplicationStatusChangedEvent(this, app, prev, newStatus));
        return toDTO(app);
    }

    private void autoAssignClassGroup(Student student) {
        if (student.getClassGroup() != null) return;
        Optional<ClassGroup> group = classGroupRepository
                .findFirstByDepartmentOrderByNameAsc(student.getDepartment());
        group.ifPresent(g -> {
            student.setClassGroup(g);
            studentRepository.save(student);
            log.info("Auto-assigned student {} to class group {}", student.getEmail(), g.getName());
        });
    }

    @Transactional(readOnly = true)
    public ApplicationDTO getById(Long applicationId) {
        return toDTO(applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId)));
    }

    @Transactional(readOnly = true)
    public List<ApplicationDTO> getAll() {
        return applicationRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDTO> getByStatus(ApplicationStatus status) {
        return applicationRepository.findByStatus(status).stream().map(this::toDTO).collect(Collectors.toList());
    }

    private Application getAppOwnedBy(Long applicationId, Long studentId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));
        if (!app.getStudent().getId().equals(studentId)) {
            throw new BusinessException("Application does not belong to you");
        }
        return app;
    }

    private ApplicationDTO toDTO(Application app) {
        List<DocumentDTO> docs = app.getDocuments().stream()
                .map(d -> DocumentDTO.builder()
                        .id(d.getId())
                        .type(d.getType())
                        .fileName(d.getFileName())
                        .status(d.getStatus())
                        .validationMessage(d.getValidationMessage())
                        .reviewerAnnotation(d.getReviewerAnnotation())
                        .uploadedAt(d.getUploadedAt())
                        .downloadUrl("/api/documents/" + d.getId() + "/download")
                        .build())
                .collect(Collectors.toList());

        long validCount = app.getDocuments().stream()
                .filter(d -> d.getStatus() == DocumentStatus.VALID).count();

        Student student = app.getStudent();
        String classGroupName = student.getClassGroup() != null ? student.getClassGroup().getName() : null;
        Long classGroupId = student.getClassGroup() != null ? student.getClassGroup().getId() : null;

        return ApplicationDTO.builder()
                .id(app.getId())
                .studentId(student.getId())
                .studentName(student.getFullName())
                .studentEmail(student.getEmail())
                .registrationType(app.getRegistrationType())
                .status(app.getStatus())
                .reviewerComment(app.getReviewerComment())
                .refusalReason(app.getRefusalReason())
                .submittedAt(app.getSubmittedAt())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .documents(docs)
                .documentsTotal(app.getDocuments().size())
                .documentsValid((int) validCount)
                .classGroupId(classGroupId)
                .classGroupName(classGroupName)
                .build();
    }
}
