package com.unigate.registration.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotNull private ReviewAction action;
    private String comment;
    private String refusalReason;

    public enum ReviewAction { APPROVE, REFUSE, REQUEST_INCOMPLETE }
}
