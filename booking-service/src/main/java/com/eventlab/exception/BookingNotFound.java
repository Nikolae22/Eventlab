package com.eventlab.exception;

public class BookingNotFound extends RuntimeException {
    public BookingNotFound(Long id) {
        super("Prenotazione con id " + id + " non trovata");
    }
}
