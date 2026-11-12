package com.eventlab.dto;

import java.time.LocalDateTime;

public record BookingResponse(
        Long id,
        Long eventId,
        String participantName,
        String participantEmail,
        LocalDateTime createdAt
) {
}
