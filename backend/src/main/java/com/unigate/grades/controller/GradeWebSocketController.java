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

    @MessageMapping("/grades/simulate")
    @SendToUser("/queue/grades/simulation")
    public SimulationResult simulate(SimulationRequest request, Principal principal) {
        return gradeService.simulateFull(request);
    }
}
