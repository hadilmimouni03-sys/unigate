package com.unigate.common.aspect;

import com.unigate.notification.entity.AuditLog;
import com.unigate.notification.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    @AfterReturning(
            pointcut = "execution(* com.unigate.registration.service.ApplicationService.review*(..)) || " +
                       "execution(* com.unigate.registration.service.ApplicationService.assign*(..)) || " +
                       "execution(* com.unigate.registration.service.DocumentService.annotate*(..))",
            returning = "result"
    )
    public void auditAdminAction(JoinPoint joinPoint, Object result) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return;

        auditLogRepository.save(AuditLog.builder()
                .actorEmail(auth.getName())
                .actorRole(auth.getAuthorities().stream().findFirst().map(Object::toString).orElse("UNKNOWN"))
                .action(joinPoint.getSignature().getName())
                .entityType("Application")
                .details("Args: " + Arrays.toString(joinPoint.getArgs()))
                .build());
    }
}
