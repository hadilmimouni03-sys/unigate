package com.unigate.skillswap.controller;

import com.unigate.registration.entity.User;
import com.unigate.skillswap.dto.SkillOfferDTO;
import com.unigate.skillswap.dto.SkillSwapDTO;
import com.unigate.skillswap.service.SkillSwapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skillswap")
@RequiredArgsConstructor
public class SkillSwapController {

    private final SkillSwapService skillSwapService;

    @PutMapping("/offer")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SkillOfferDTO> createOrUpdateOffer(@RequestBody SkillOfferDTO dto,
                                                              @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillSwapService.createOrUpdateOffer(user.getId(), dto));
    }

    @GetMapping("/marketplace")
    public ResponseEntity<List<SkillOfferDTO>> marketplace(@AuthenticationPrincipal User user) {
        Long currentUserId = user != null ? user.getId() : null;
        return ResponseEntity.ok(skillSwapService.getMarketplace(currentUserId));
    }

    @GetMapping("/matches")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SkillOfferDTO>> findMatches(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillSwapService.findMatches(user.getId()));
    }

    @PostMapping("/request")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SkillSwapDTO> requestSwap(@RequestBody Map<String, Object> body,
                                                     @AuthenticationPrincipal User user) {
        Long providerOfferId = Long.valueOf(body.get("providerOfferId").toString());
        String message = (String) body.get("message");
        return ResponseEntity.ok(skillSwapService.requestSwap(user.getId(), providerOfferId, message));
    }

    @PostMapping("/{swapId}/respond")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SkillSwapDTO> respond(@PathVariable Long swapId,
                                                 @RequestBody Map<String, Object> body,
                                                 @AuthenticationPrincipal User user) {
        boolean accept = Boolean.parseBoolean(body.get("accept").toString());
        String responseMsg = (String) body.getOrDefault("responseMessage", "");
        return ResponseEntity.ok(skillSwapService.respondToSwap(swapId, user.getId(), accept, responseMsg));
    }

    @PostMapping("/{swapId}/complete")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SkillSwapDTO> complete(@PathVariable Long swapId,
                                                  @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillSwapService.completeSwap(swapId, user.getId()));
    }

    @GetMapping("/my-swaps")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SkillSwapDTO>> mySwaps(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillSwapService.getMySwaps(user.getId()));
    }
}
