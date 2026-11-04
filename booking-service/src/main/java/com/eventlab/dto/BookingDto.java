package com.eventlab.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BookingDto(
        @NotNull(message = "Event id required")
        Long eventId,

        @NotBlank(message = "Name is Required")
        String participantName,

        @NotBlank(message = "Email is Required")
        @Email(message = "Email non valida")
        String participantEmail
) {
}
