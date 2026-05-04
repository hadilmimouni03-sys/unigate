package com.unigate.registration.dto;

import com.unigate.registration.enums.RegistrationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String firstName;
    @NotBlank private String lastName;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 8) private String password;
    @NotNull private RegistrationType registrationType;
    private String department;
    private String speciality;
    private String partnerUniversity;
    private String partnerCountry;
    private String targetSemester;
}
