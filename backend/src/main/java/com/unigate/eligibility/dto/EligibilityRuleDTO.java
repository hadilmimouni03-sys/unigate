package com.unigate.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EligibilityRuleDTO {
    private Long id;
    private String department;
    private String yearLevel;
    private String ruleName;
    private String conditionType;
    private String targetValue;
    private boolean enabled;
}
