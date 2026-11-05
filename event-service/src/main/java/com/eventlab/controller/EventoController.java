package com.eventlab.controller;

import com.eventlab.dto.EventoDto;
import com.eventlab.dto.EventoResponse;
import com.eventlab.service.EventoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Eventi", description = "API per la gestione e consultazione degli eventi (Event Service)")
public class EventoController {

    private final EventoService eventoService;



    @GetMapping
    @Operation(summary = "Elenco eventi", description = "Restituisce la lista di tutti gli eventi disponibili.")
    @ApiResponse(responseCode = "200", description = "Elenco recuperato con successo",
            content = @Content(mediaType = "application/json",
                    array = @ArraySchema(schema = @Schema(implementation = EventoDto.class))))
    public ResponseEntity<List<EventoDto>> findAll(){
        return ResponseEntity.ok(eventoService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Dettaglio evento",
            description = "Restituisce i dettagli, la capienza e le informazioni di un evento tramite il suo ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Evento trovato",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = EventoResponse.class))),
            @ApiResponse(responseCode = "404", description = "Evento non trovato", content = @Content)
    })
    public ResponseEntity<EventoResponse> getById(@PathVariable Long id){
        return ResponseEntity.ok(eventoService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crea evento", description = "Permette all'operatore di creare un nuovo evento inserendo titolo, data e capienza (Riservato agli operatori).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Evento creato con successo",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EventoDto.class))),
            @ApiResponse(responseCode = "400", description = "Dati non validi o errore di validazione", content = @Content)
    })
    public ResponseEntity<EventoDto> createEvent(@RequestBody @Valid EventoDto eventoDto){
        return ResponseEntity.status(HttpStatus.CREATED).body(
                eventoService.create(eventoDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Aggiorna evento", description = "Permette all'operatore di modificare un evento esistente tramite il suo ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Evento aggiornato con successo",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EventoDto.class))),
            @ApiResponse(responseCode = "404", description = "Evento non trovato", content = @Content),
            @ApiResponse(responseCode = "400", description = "Dati non validi", content = @Content)
    })
    public ResponseEntity<EventoDto> updateEvento(@PathVariable Long id,
                                                  @RequestBody @Valid EventoDto eventoDto){
        return ResponseEntity.ok(eventoService.updateById(id,eventoDto));
    }
}
