package com.unigate.grades.controller;

import com.unigate.grades.dto.SimulationRequest;
import com.unigate.grades.dto.SimulationResult;
import com.unigate.grades.service.GradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class GradeWebSocketController {

    private final GradeService gradeService;

    /**
     * Receives hypothetical marks via STOMP, computes the full hierarchy
     * (subject → module → semester) without persisting, and pushes the
     * SimulationResult back to the requesting user only.
     *
     * Client sends to:  /app/grades/simulate
     * Client receives:  /user/{username}/queue/grades/simulation
     */
    @MessageMapping("/grades/simulate")
    @SendToUser("/queue/grades/simulation")
    public SimulationResult simulate(SimulationRequest request, Principal principal) {
        return gradeService.simulateFull(request);
    }
}
