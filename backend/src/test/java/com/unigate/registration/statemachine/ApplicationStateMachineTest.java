package com.unigate.registration.statemachine;

import com.unigate.registration.enums.ApplicationEvent;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.RegistrationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.statemachine.StateMachine;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationStateMachineTest {

    private ApplicationStateMachineService service;

    @BeforeEach
    void setUp() {
        service = new ApplicationStateMachineService();
    }

    @Test
    void configA_happyPath_endsApproved() throws Exception {
        StateMachine<ApplicationStatus, ApplicationEvent> sm =
                service.buildMachine(RegistrationType.FIRST_YEAR_ING);
        sm.start();

        sm.sendEvent(ApplicationEvent.SUBMIT);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.SUBMITTED);

        // Admin approves directly from SUBMITTED (no reviewer assignment needed)
        sm.sendEvent(ApplicationEvent.APPROVE);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.APPROVED);
    }

    @Test
    void configA_viaUnderReview_endsApproved() throws Exception {
        StateMachine<ApplicationStatus, ApplicationEvent> sm =
                service.buildMachine(RegistrationType.FIRST_YEAR_ING);
        sm.start();

        sm.sendEvent(ApplicationEvent.SUBMIT);
        sm.sendEvent(ApplicationEvent.ASSIGN_REVIEWER);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.UNDER_REVIEW);

        sm.sendEvent(ApplicationEvent.APPROVE);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.APPROVED);
    }

    @Test
    void configA_incompleteLoop_thenApproved() throws Exception {
        StateMachine<ApplicationStatus, ApplicationEvent> sm =
                service.buildMachine(RegistrationType.FIRST_YEAR_ING);
        sm.start();
        sm.sendEvent(ApplicationEvent.SUBMIT);
        sm.sendEvent(ApplicationEvent.REQUEST_INCOMPLETE);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.INCOMPLETE);

        // RESUBMIT goes back to SUBMITTED (not UNDER_REVIEW)
        sm.sendEvent(ApplicationEvent.RESUBMIT);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.SUBMITTED);

        sm.sendEvent(ApplicationEvent.APPROVE);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.APPROVED);
    }

    @Test
    void configB_canRefuse() throws Exception {
        StateMachine<ApplicationStatus, ApplicationEvent> sm =
                service.buildMachine(RegistrationType.MASTER_M1);
        sm.start();
        sm.sendEvent(ApplicationEvent.SUBMIT);
        sm.sendEvent(ApplicationEvent.REFUSE);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.REFUSED);
    }

    @Test
    void configA_cannotRefuse() throws Exception {
        StateMachine<ApplicationStatus, ApplicationEvent> sm =
                service.buildMachine(RegistrationType.FIRST_YEAR_ING);
        sm.start();
        sm.sendEvent(ApplicationEvent.SUBMIT);
        // REFUSE has no transition in config A — state must stay SUBMITTED
        sm.sendEvent(ApplicationEvent.REFUSE);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.SUBMITTED);
    }

    @Test
    void restoreToState_underReview() throws Exception {
        StateMachine<ApplicationStatus, ApplicationEvent> sm =
                service.restoreToState(RegistrationType.MASTER_M1, ApplicationStatus.UNDER_REVIEW);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.UNDER_REVIEW);
    }

    @Test
    void restoreToState_incomplete() throws Exception {
        StateMachine<ApplicationStatus, ApplicationEvent> sm =
                service.restoreToState(RegistrationType.FIRST_YEAR_ING, ApplicationStatus.INCOMPLETE);
        assertThat(sm.getState().getId()).isEqualTo(ApplicationStatus.INCOMPLETE);
    }
}
