package com.eventlab.exception;

public class EventoNonTrovatoException extends RuntimeException {
    public EventoNonTrovatoException(Long id) {
        super("Evento con id " + id + " non trovato");
    }
}