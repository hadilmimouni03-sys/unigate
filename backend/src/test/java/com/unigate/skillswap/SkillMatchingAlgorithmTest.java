package com.unigate.skillswap;

import com.unigate.skillswap.entity.Skill;
import com.unigate.skillswap.entity.SkillOffer;
import com.unigate.registration.entity.Student;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class SkillMatchingAlgorithmTest {

    private static final double W_SKILLS       = 0.30;
    private static final double W_AVAILABILITY = 0.25;
    private static final double W_GRADE        = 0.25;
    private static final double W_RATING       = 0.10;
    private static final double W_DEPARTMENT   = 0.10;

    /** Simplified score without DB dependencies */
    private double computeScore(SkillOffer requester, SkillOffer provider,
                                Double avgGrade, Double avgRating) {
        Set<Long> wantedIds = Set.copyOf(requester.getSkillsWanted().stream()
                .map(Skill::getId).toList());
        Set<Long> offeredIds = Set.copyOf(provider.getSkillsOffered().stream()
                .map(Skill::getId).toList());
        long overlap = wantedIds.stream().filter(offeredIds::contains).count();
        double skillScore = wantedIds.isEmpty() ? 0 : (double) overlap / wantedIds.size();

        double availScore = (requester.getAvailability() != null && !requester.getAvailability().isBlank()
                && provider.getAvailability() != null && !provider.getAvailability().isBlank()) ? 1.0 : 0.0;

        double gradeScore = (avgGrade != null) ? avgGrade / 20.0 : 0.0;
        double ratingScore = (avgRating != null) ? (avgRating - 1.0) / 4.0 : 0.5;

        String reqDept = requester.getStudent().getDepartment();
        String proDept = provider.getStudent().getDepartment();
        double deptScore = (reqDept != null && reqDept.equalsIgnoreCase(proDept)) ? 1.0 : 0.0;

        return W_SKILLS * skillScore + W_AVAILABILITY * availScore
                + W_GRADE * gradeScore + W_RATING * ratingScore
                + W_DEPARTMENT * deptScore;
    }

    private Student student(String dept) {
        Student s = new Student();
        s.setDepartment(dept);
        return s;
    }

    private Skill skill(Long id, String name) {
        return Skill.builder().id(id).name(name).build();
    }

    @Test
    void perfectMatch_maxScore() {
        Skill java = skill(1L, "Java");
        Student req = student("Informatique");
        Student prov = student("Informatique");

        SkillOffer requester = SkillOffer.builder()
                .student(req).skillsWanted(Set.of(java))
                .availability("Mon 14:00").build();
        SkillOffer provider = SkillOffer.builder()
                .student(prov).skillsOffered(Set.of(java))
                .availability("Mon 14:00").build();

        double score = computeScore(requester, provider, 18.0, 5.0);
        // skills=1.0, avail=1.0, grade=18/20=0.9, rating=(5-1)/4=1.0, dept=1.0
        double expected = W_SKILLS * 1.0 + W_AVAILABILITY * 1.0
                + W_GRADE * 0.9 + W_RATING * 1.0 + W_DEPARTMENT * 1.0;
        assertThat(score).isCloseTo(expected, org.assertj.core.data.Offset.offset(0.001));
    }

    @Test
    void noSkillOverlap_skillScoreZero() {
        Skill java = skill(1L, "Java");
        Skill python = skill(2L, "Python");
        Student req = student("Info");
        Student prov = student("Info");

        SkillOffer requester = SkillOffer.builder()
                .student(req).skillsWanted(Set.of(java)).availability("Mon").build();
        SkillOffer provider = SkillOffer.builder()
                .student(prov).skillsOffered(Set.of(python)).availability("Mon").build();

        double score = computeScore(requester, provider, 10.0, 3.0);
        double expected = W_SKILLS * 0.0 + W_AVAILABILITY * 1.0
                + W_GRADE * 0.5 + W_RATING * 0.5 + W_DEPARTMENT * 1.0;
        assertThat(score).isCloseTo(expected, org.assertj.core.data.Offset.offset(0.001));
    }

    @Test
    void differentDepartment_noDeptBonus() {
        Skill java = skill(1L, "Java");
        Student req = student("Informatique");
        Student prov = student("Genie-Civil");

        SkillOffer requester = SkillOffer.builder()
                .student(req).skillsWanted(Set.of(java)).availability("Mon").build();
        SkillOffer provider = SkillOffer.builder()
                .student(prov).skillsOffered(Set.of(java)).availability("Mon").build();

        double score = computeScore(requester, provider, 12.0, null);
        // dept component should be 0
        assertThat(score).isLessThan(W_SKILLS * 1.0 + W_AVAILABILITY * 1.0
                + W_GRADE * 0.6 + W_RATING * 0.5 + W_DEPARTMENT * 1.0);
    }
}
