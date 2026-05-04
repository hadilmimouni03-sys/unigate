package com.unigate.registration.event;

import com.unigate.registration.entity.Application;
import com.unigate.registration.enums.ApplicationStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ApplicationStatusChangedEvent extends ApplicationEvent {

    private final Application application;
    private final ApplicationStatus previousStatus;
    private final ApplicationStatus newStatus;

    public ApplicationStatusChangedEvent(Object source, Application application,
                                         ApplicationStatus previousStatus, ApplicationStatus newStatus) {
        super(source);
        this.application = application;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
    }
}
