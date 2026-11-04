package com.eventlab.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record EventoDto(
        @NotBlank(message = "Titolo cannot be empty")
        @Size(max = 100)
        String titolo,
        @Size(max = 500)
        String descrizione,
        @NotNull @Future
        LocalDateTime dataEvento,
        @Size(max = 255)
        String luogo,
        @NotNull @Positive(message = "Non puo essere negativa la capienza")
        Integer capienzaMassima
) {
}
