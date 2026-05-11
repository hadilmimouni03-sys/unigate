package com.unigate.registration.statemachine;

import com.unigate.registration.enums.ApplicationEvent;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.RegistrationType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineBuilder;
import org.springframework.stereotype.Service;

import java.util.EnumSet;

@Service
@Slf4j
public class ApplicationStateMachineService {

    public StateMachine<ApplicationStatus, ApplicationEvent> buildMachine(RegistrationType type) throws Exception {
        return type.isSelectiveType() ? buildConfigB() : buildConfigA();
    }

    /** Config A — Ing types: no REFUSED terminal state */
    private StateMachine<ApplicationStatus, ApplicationEvent> buildConfigA() throws Exception {
        var builder = StateMachineBuilder.<ApplicationStatus, ApplicationEvent>builder();
        builder.configureStates().withStates()
                .initial(ApplicationStatus.DRAFT)
                .states(EnumSet.of(ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED,
                        ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INCOMPLETE))
                .end(ApplicationStatus.APPROVED);
        builder.configureTransitions()
                .withExternal().source(ApplicationStatus.DRAFT).target(ApplicationStatus.SUBMITTED).event(ApplicationEvent.SUBMIT).and()
                
                .withExternal().source(ApplicationStatus.SUBMITTED).target(ApplicationStatus.UNDER_REVIEW).event(ApplicationEvent.ASSIGN_REVIEWER).and()
                
                .withExternal().source(ApplicationStatus.SUBMITTED).target(ApplicationStatus.INCOMPLETE).event(ApplicationEvent.REQUEST_INCOMPLETE).and()
                
                .withExternal().source(ApplicationStatus.SUBMITTED).target(ApplicationStatus.APPROVED).event(ApplicationEvent.APPROVE).and()
                
                .withExternal().source(ApplicationStatus.UNDER_REVIEW).target(ApplicationStatus.INCOMPLETE).event(ApplicationEvent.REQUEST_INCOMPLETE).and()
                
                .withExternal().source(ApplicationStatus.UNDER_REVIEW).target(ApplicationStatus.APPROVED).event(ApplicationEvent.APPROVE).and()
                
                .withExternal().source(ApplicationStatus.INCOMPLETE).target(ApplicationStatus.SUBMITTED).event(ApplicationEvent.RESUBMIT);
        return builder.build();
    }

    /** Config B — Master/DD/Exchange: includes REFUSED terminal state */
    private StateMachine<ApplicationStatus, ApplicationEvent> buildConfigB() throws Exception {
        var builder = StateMachineBuilder.<ApplicationStatus, ApplicationEvent>builder();
        builder.configureStates().withStates()
                .initial(ApplicationStatus.DRAFT)
                .states(EnumSet.of(ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED,
                        ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INCOMPLETE))
                .end(ApplicationStatus.APPROVED)
                .end(ApplicationStatus.REFUSED);
        builder.configureTransitions()
                .withExternal().source(ApplicationStatus.DRAFT).target(ApplicationStatus.SUBMITTED).event(ApplicationEvent.SUBMIT).and()
                .withExternal().source(ApplicationStatus.SUBMITTED).target(ApplicationStatus.UNDER_REVIEW).event(ApplicationEvent.ASSIGN_REVIEWER).and()
                .withExternal().source(ApplicationStatus.SUBMITTED).target(ApplicationStatus.INCOMPLETE).event(ApplicationEvent.REQUEST_INCOMPLETE).and()
                .withExternal().source(ApplicationStatus.SUBMITTED).target(ApplicationStatus.APPROVED).event(ApplicationEvent.APPROVE).and()
                .withExternal().source(ApplicationStatus.SUBMITTED).target(ApplicationStatus.REFUSED).event(ApplicationEvent.REFUSE).and()
                .withExternal().source(ApplicationStatus.UNDER_REVIEW).target(ApplicationStatus.INCOMPLETE).event(ApplicationEvent.REQUEST_INCOMPLETE).and()
                .withExternal().source(ApplicationStatus.UNDER_REVIEW).target(ApplicationStatus.APPROVED).event(ApplicationEvent.APPROVE).and()
                .withExternal().source(ApplicationStatus.UNDER_REVIEW).target(ApplicationStatus.REFUSED).event(ApplicationEvent.REFUSE).and()
                .withExternal().source(ApplicationStatus.INCOMPLETE).target(ApplicationStatus.SUBMITTED).event(ApplicationEvent.RESUBMIT);
        return builder.build();
    }

    public ApplicationStatus sendEvent(StateMachine<ApplicationStatus, ApplicationEvent> sm, ApplicationEvent event) {
        sm.start();
        sm.sendEvent(event);
        return sm.getState().getId();
    }

    public StateMachine<ApplicationStatus, ApplicationEvent> restoreToState(
            RegistrationType type, ApplicationStatus current) throws Exception {
        var sm = buildMachine(type);
        sm.start();
        switch (current) {
            case SUBMITTED   -> sm.sendEvent(ApplicationEvent.SUBMIT);
            case UNDER_REVIEW -> { sm.sendEvent(ApplicationEvent.SUBMIT); sm.sendEvent(ApplicationEvent.ASSIGN_REVIEWER); }
            case INCOMPLETE  -> { sm.sendEvent(ApplicationEvent.SUBMIT); sm.sendEvent(ApplicationEvent.REQUEST_INCOMPLETE); }
            case APPROVED    -> { sm.sendEvent(ApplicationEvent.SUBMIT); sm.sendEvent(ApplicationEvent.APPROVE); }
            case REFUSED     -> { sm.sendEvent(ApplicationEvent.SUBMIT); sm.sendEvent(ApplicationEvent.REFUSE); }
            default          -> {}
        }
        return sm;
    }
}
