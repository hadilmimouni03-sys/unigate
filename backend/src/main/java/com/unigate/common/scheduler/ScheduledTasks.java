package com.unigate.common.scheduler;

import com.unigate.registration.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final ApplicationRepository applicationRepository;

    @Scheduled(fixedRate = 3_600_000)
    public void detectSlaBreaches() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(48);
        var breached = applicationRepository.findSlaBreached(cutoff);
        if (!breached.isEmpty()) {
            log.warn("SLA BREACH: {} application(s) have been under review for more than 48 hours",
                    breached.size());
            breached.forEach(a -> log.warn("  → Application #{} (student: {})",
                    a.getId(), a.getStudent().getEmail()));
        }
    }
}
