package com.unigate.registration.service;

import com.unigate.common.security.JwtTokenProvider;
import com.unigate.exception.BusinessException;
import com.unigate.registration.dto.*;
import com.unigate.registration.entity.RefreshToken;
import com.unigate.registration.entity.Student;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import com.unigate.registration.repository.RefreshTokenRepository;
import com.unigate.registration.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered");
        }
        Student student = new Student();
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setEmail(request.getEmail());
        student.setPassword(passwordEncoder.encode(request.getPassword()));
        student.setRole(Role.STUDENT);
        student.setEnabled(true);
        student.setRegistrationType(request.getRegistrationType());
        student.setDepartment(request.getDepartment());
        student.setSpeciality(request.getSpeciality());
        student.setPartnerUniversity(request.getPartnerUniversity());
        student.setPartnerCountry(request.getPartnerCountry());
        student.setTargetSemester(request.getTargetSemester());

        userRepository.save(student);
        String accessToken = jwtTokenProvider.generateToken(student);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(student);
        return buildResponse(student, accessToken, refreshToken.getToken());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("User not found"));
        String accessToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return buildResponse(user, accessToken, refreshToken.getToken());
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Refresh token not found"));
        refreshTokenService.verifyExpiration(refreshToken);
        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.generateToken(user);
        return buildResponse(user, newAccessToken, refreshToken.getToken());
    }

    @Transactional
    public void logout(User user) {
        refreshTokenService.deleteByUser(user);
    }

    private AuthResponse buildResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }
}
