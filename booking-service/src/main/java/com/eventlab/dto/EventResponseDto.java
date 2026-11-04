package com.eventlab.dto;

import java.time.LocalDateTime;

public record EventResponseDto(
        Long id,
        String titolo,
        LocalDateTime dataEvento,
        Integer capienzaMassima
) {
}
