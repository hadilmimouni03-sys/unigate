package com.unigate.registration.dto;

import com.unigate.registration.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
}
