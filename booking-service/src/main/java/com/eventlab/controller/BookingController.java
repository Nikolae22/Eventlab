package com.eventlab.controller;

import com.eventlab.dto.BookingDto;
import com.eventlab.dto.BookingResponse;
import com.eventlab.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Prenotazioni", description = "Gestione delle prenotazioni agli eventi")
public class BookingController {

    private final BookingService bookingService;

    @Operation(summary = "Elenco prenotazioni di un evento",
            description = "Restituisce tutte le prenotazioni registrate per l'evento indicato. Riservato all'operatore.")
    @ApiResponse(responseCode = "200", description = "Elenco prenotazioni")
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<BookingResponse>> getBookingsForEvent(@PathVariable Long eventId){
        return ResponseEntity.ok(bookingService.getBookings(eventId));
    }

    @Operation(summary = "Numero prenotazioni attive",
            description = "Conta le prenotazioni registrate per l'evento. Riservato all'operatore.")
    @ApiResponse(responseCode = "200", description = "Numero di prenotazioni")
    @GetMapping("/event/{eventId}/count")
    public ResponseEntity<Long> numeroPrenotatiEvento(@PathVariable Long eventId){
        return ResponseEntity.ok(bookingService.getNumberOfBookingsForEvent(eventId));
    }

    @Operation(summary = "Annulla una prenotazione",
            description = "Elimina la prenotazione con l'id indicato. Riservato all'operatore.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Prenotazione annullata"),
            @ApiResponse(responseCode = "404", description = "Prenotazione non trovata")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id){
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }


    @Operation(summary = "Prenotazione a un evento",
            description = "Registra una prenotazione verificando che l'evento esista, non sia passato, non sia completo e che l'email non sia già registrata.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Prenotazione creata",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = BookingResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dati non validi", content = @Content),
            @ApiResponse(responseCode = "404", description = "Evento non trovato", content = @Content),
            @ApiResponse(responseCode = "409", description = "Evento completo o email già prenotata", content = @Content),
            @ApiResponse(responseCode = "503", description = "Servizio eventi non disponibile", content = @Content)
    })
    @PostMapping
    public ResponseEntity<BookingResponse> bookingEvent(@Valid @RequestBody BookingDto bookingDto){
        return ResponseEntity.ok(bookingService.createBooking(bookingDto));
    }
}
