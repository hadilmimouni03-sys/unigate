package com.unigate.registration.repository;

import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    Optional<User> findByEmailVerificationToken(String token);

    @Modifying
    @Query("UPDATE User u SET u.enabled = true, u.accountNonLocked = true WHERE u.enabled = false OR u.accountNonLocked = false")
    int enableAllDisabledUsers();
}
