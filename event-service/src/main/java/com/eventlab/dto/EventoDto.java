package com.eventlab.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record EventoDto(
        @NotBlank @Size(max = 100)
        String titolo,
        @NotNull @Future
        LocalDateTime dataEvento,
        @Size(max = 255)
        String luogo,
        @NotNull @Positive
        Integer capienzaMassima
) {
}
