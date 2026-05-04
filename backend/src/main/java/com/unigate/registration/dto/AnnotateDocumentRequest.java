package com.unigate.registration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnnotateDocumentRequest {
    @NotBlank private String annotation;
}
