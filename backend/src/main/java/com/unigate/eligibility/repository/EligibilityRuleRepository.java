package com.unigate.eligibility.repository;

import com.unigate.eligibility.entity.EligibilityRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EligibilityRuleRepository extends JpaRepository<EligibilityRule, Long> {
    List<EligibilityRule> findByDepartmentAndYearLevel(String department, String yearLevel);
    List<EligibilityRule> findByDepartment(String department);
    void deleteByDepartmentAndYearLevel(String department, String yearLevel);
}
