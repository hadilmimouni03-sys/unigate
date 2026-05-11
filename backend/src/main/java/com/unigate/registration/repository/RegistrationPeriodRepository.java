package com.unigate.registration.repository;

import com.unigate.registration.entity.RegistrationPeriod;
import com.unigate.registration.enums.PeriodStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationPeriodRepository extends JpaRepository<RegistrationPeriod, Long> {
    List<RegistrationPeriod> findAllByOrderByStartDateDesc();
    Optional<RegistrationPeriod> findFirstByStatusOrderByStartDateDesc(PeriodStatus status);
}
