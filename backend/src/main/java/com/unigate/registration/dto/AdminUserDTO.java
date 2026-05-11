package com.unigate.registration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminUserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String department;
    private int reviewedCount;
    private int pendingCount;
}
