package com.eventlab.dto;

import java.time.LocalDateTime;

public record EventoResponse(
        Long id,
        String titolo,
        String descrizione,
        LocalDateTime dataEvento,
        String luogo,
        Integer capienzaMassima
) {
}
