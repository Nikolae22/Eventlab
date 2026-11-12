package com.eventlab.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalHandlerException {

    @ExceptionHandler(BookingNotFound.class)
    public ResponseEntity<Map<String, String>> nonTrovata(BookingNotFound ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("errore", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(EventoNonTrovatoException.class)
    public ResponseEntity<Map<String, String>> eventoNonTrovato(EventoNonTrovatoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("errore", ex.getMessage()));
    }

    @ExceptionHandler({PrenotazioneDuplicataException.class,
            EventoCompletoException.class})
    public ResponseEntity<Map<String, String>> conflitto(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("errore", ex.getMessage()));
    }

    @ExceptionHandler(EventoPassatoException.class)
    public ResponseEntity<Map<String, String>> eventoPassato(EventoPassatoException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", ex.getMessage()));
    }

}
