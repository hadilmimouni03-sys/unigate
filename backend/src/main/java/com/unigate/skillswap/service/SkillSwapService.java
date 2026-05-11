package com.unigate.skillswap.service;

import com.unigate.exception.BusinessException;
import com.unigate.exception.ResourceNotFoundException;
import com.unigate.grades.repository.StudentGradeRepository;
import com.unigate.registration.repository.StudentRepository;
import com.unigate.skillswap.dto.SkillOfferDTO;
import com.unigate.skillswap.dto.SkillSwapDTO;
import com.unigate.skillswap.entity.*;
import com.unigate.skillswap.enums.SwapStatus;
import com.unigate.skillswap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillSwapService {

    private static final double W_SKILLS       = 0.30;
    private static final double W_AVAILABILITY = 0.25;
    private static final double W_GRADE        = 0.25;
    private static final double W_RATING       = 0.10;
    private static final double W_DEPARTMENT   = 0.10;

    private final SkillOfferRepository offerRepository;
    private final SkillSwapRepository swapRepository;
    private final SkillRepository skillRepository;
    private final SwapRatingRepository ratingRepository;
    private final StudentRepository studentRepository;
    private final StudentGradeRepository gradeRepository;

    @Transactional
    public SkillOfferDTO createOrUpdateOffer(Long studentId, SkillOfferDTO dto) {
        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        SkillOffer offer = offerRepository.findByStudentIdAndActiveTrue(studentId)
                .orElse(SkillOffer.builder().student(student).build());

        offer.setDescription(dto.getDescription());
        offer.setAvailability(dto.getAvailability());
        offer.setActive(true);
        offer.setSkillsOffered(resolveSkills(dto.getSkillsOffered()));
        offer.setSkillsWanted(resolveSkills(dto.getSkillsWanted()));

        return toOfferDTO(offerRepository.save(offer));
    }

    @Transactional(readOnly = true)
    public List<SkillOfferDTO> getMarketplace(Long currentUserId) {
        return offerRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .filter(o -> currentUserId == null || !o.getStudent().getId().equals(currentUserId))
                .map(this::toOfferDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillOfferDTO> findMatches(Long studentId) {
        SkillOffer myOffer = offerRepository.findByStudentIdAndActiveTrue(studentId)
                .orElseThrow(() -> new BusinessException("Create an offer first to find matches"));

        Set<Long> wantedIds = myOffer.getSkillsWanted().stream()
                .map(Skill::getId).collect(Collectors.toSet());

        if (wantedIds.isEmpty()) return Collections.emptyList();

        return offerRepository.findActiveOffersWithSkills(wantedIds).stream()
                .filter(o -> !o.getStudent().getId().equals(studentId))
                .map(o -> {
                    SkillOfferDTO dto = toOfferDTO(o);
                    dto.setMatchScore(computeScore(myOffer, o));
                    return dto;
                })
                .sorted(Comparator.comparingDouble(dto -> -dto.getMatchScore()))
                .collect(Collectors.toList());
    }

    @Transactional
    public SkillSwapDTO requestSwap(Long requesterId, Long providerOfferId, String message) {
        var requesterStudent = studentRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", requesterId));
        SkillOffer requesterOffer = offerRepository.findByStudentIdAndActiveTrue(requesterId)
                .orElseGet(() -> offerRepository.save(
                        SkillOffer.builder().student(requesterStudent).build()));
        SkillOffer providerOffer = offerRepository.findById(providerOfferId)
                .orElseThrow(() -> new ResourceNotFoundException("SkillOffer", providerOfferId));

        double score = computeScore(requesterOffer, providerOffer);
        SkillSwap swap = SkillSwap.builder()
                .requesterOffer(requesterOffer)
                .providerOffer(providerOffer)
                .matchScore(score)
                .message(message)
                .build();
        return toSwapDTO(swapRepository.save(swap));
    }

    @Transactional
    public SkillSwapDTO respondToSwap(Long swapId, Long responderId, boolean accept, String responseMessage) {
        SkillSwap swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new ResourceNotFoundException("SkillSwap", swapId));
        if (!swap.getProviderOffer().getStudent().getId().equals(responderId)) {
            throw new BusinessException("You are not the provider for this swap");
        }
        swap.setStatus(accept ? SwapStatus.ACCEPTED : SwapStatus.REJECTED);
        swap.setResponseMessage(responseMessage);
        swap.setRespondedAt(LocalDateTime.now());
        return toSwapDTO(swapRepository.save(swap));
    }

    @Transactional
    public SkillSwapDTO completeSwap(Long swapId, Long studentId) {
        SkillSwap swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new ResourceNotFoundException("SkillSwap", swapId));
        boolean isParticipant = swap.getRequesterOffer().getStudent().getId().equals(studentId)
                || swap.getProviderOffer().getStudent().getId().equals(studentId);
        if (!isParticipant) throw new BusinessException("You are not a participant in this swap");
        if (swap.getStatus() != SwapStatus.ACCEPTED) {
            throw new BusinessException("Only ACCEPTED swaps can be completed");
        }
        swap.setStatus(SwapStatus.COMPLETED);
        swap.setCompletedAt(LocalDateTime.now());
        return toSwapDTO(swapRepository.save(swap));
    }

    @Transactional(readOnly = true)
    public List<SkillSwapDTO> getMySwaps(Long studentId) {
        return swapRepository.findByStudentId(studentId)
                .stream().map(this::toSwapDTO).collect(Collectors.toList());
    }

   
    private double computeScore(SkillOffer requester, SkillOffer provider) {
        Set<Long> wantedIds = requester.getSkillsWanted().stream().map(Skill::getId).collect(Collectors.toSet());
        Set<Long> offeredIds = provider.getSkillsOffered().stream().map(Skill::getId).collect(Collectors.toSet());
        long overlap = wantedIds.stream().filter(offeredIds::contains).count();
        double skillScore = wantedIds.isEmpty() ? 0 : (double) overlap / wantedIds.size();

        double availScore = (requester.getAvailability() != null && !requester.getAvailability().isBlank()
                && provider.getAvailability() != null && !provider.getAvailability().isBlank()) ? 1.0 : 0.0;

        var grades = gradeRepository.findByStudentId(provider.getStudent().getId());
        double avgGrade = grades.stream()
                .filter(g -> g.getFinalMark() != null)
                .mapToDouble(g -> g.getFinalMark())
                .average().orElse(0.0);
        double gradeScore = avgGrade / 20.0;

        Double avgRating = ratingRepository.findAverageScoreByRateeId(provider.getStudent().getId());
        double ratingScore = (avgRating != null) ? (avgRating - 1.0) / 4.0 : 0.5; // default 0.5 if no ratings

        String reqDept = requester.getStudent().getDepartment();
        String proDept = provider.getStudent().getDepartment();
        double deptScore = (reqDept != null && reqDept.equalsIgnoreCase(proDept)) ? 1.0 : 0.0;

        return W_SKILLS * skillScore
                + W_AVAILABILITY * availScore
                + W_GRADE * gradeScore
                + W_RATING * ratingScore
                + W_DEPARTMENT * deptScore;
    }

    private Set<Skill> resolveSkills(Set<String> names) {
        if (names == null) return new HashSet<>();
        Set<Skill> result = new HashSet<>();
        for (String name : names) {
            Skill skill = skillRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> skillRepository.save(Skill.builder().name(name).build()));
            result.add(skill);
        }
        return result;
    }

    private SkillOfferDTO toOfferDTO(SkillOffer o) {
        Double avg = ratingRepository.findAverageScoreByRateeId(o.getStudent().getId());
        Long rateeId = o.getStudent().getId();
        int reviewCount = ratingRepository.countByRateeId(rateeId);
        return SkillOfferDTO.builder()
                .id(o.getId())
                .studentId(o.getStudent().getId())
                .studentName(o.getStudent().getFullName())
                .department(o.getStudent().getDepartment())
                .skillsOffered(o.getSkillsOffered().stream().map(Skill::getName).collect(Collectors.toSet()))
                .skillsWanted(o.getSkillsWanted().stream().map(Skill::getName).collect(Collectors.toSet()))
                .description(o.getDescription())
                .availability(o.getAvailability())
                .active(o.isActive())
                .createdAt(o.getCreatedAt())
                .averageRating(avg)
                .reviewCount(reviewCount)
                .build();
    }

    private SkillSwapDTO toSwapDTO(SkillSwap s) {
        return SkillSwapDTO.builder()
                .id(s.getId())
                .requesterOfferId(s.getRequesterOffer().getId())
                .requesterName(s.getRequesterOffer().getStudent().getFullName())
                .providerOfferId(s.getProviderOffer().getId())
                .providerName(s.getProviderOffer().getStudent().getFullName())
                .status(s.getStatus())
                .matchScore(s.getMatchScore())
                .message(s.getMessage())
                .responseMessage(s.getResponseMessage())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
