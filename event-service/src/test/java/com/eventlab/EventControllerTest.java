package com.eventlab;


import com.eventlab.dto.EventoDto;
import com.eventlab.dto.EventoResponse;
import com.eventlab.exception.EventoNonTrovatoException;
import com.eventlab.service.EventoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import org.springframework.http.MediaType;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisplayName("EventService Controller test")
@ActiveProfiles("test")
public class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventoService eventoService;

    private List<EventoResponse> eventi;

    @BeforeEach
    void setUp() {
        // Creiamo la lista a mano come vuoi tu, senza passare dal database
        eventi = List.of(
                new EventoResponse(1L, "Concerto Mockito", "Test con dati finti", LocalDateTime.now().plusDays(2), "Teatro", 100),
                new EventoResponse(2L, "Corso Spring Boot", "Imariamo a testare", LocalDateTime.now().plusDays(5), "Online", 50)
        );
    }




    @Test
    @DisplayName("GET /api/events  messages-> 200 ok and the list")
    void get_list_events () throws Exception {
        when(eventoService.getAll())
                .thenReturn(eventi);
        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()", is(2)))
                .andExpect(jsonPath("$[0].titolo", is("Concerto Mockito")));
    }

    @Test
    @DisplayName("GET /api/events/{id} messages-> 200 ok e detagli evento")
    void get_event_by_id_and_details() throws Exception {
        EventoResponse eventoAtteso=eventi.get(0);
        when(eventoService.findById(1L))
                .thenReturn(eventoAtteso);

        mockMvc.perform(get("/api/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.titolo", is("Concerto Mockito")))
                .andExpect(jsonPath("$.luogo", is("Teatro")));
    }

    @Test
    @DisplayName("GET /api/events/{id} ->404 not found evento non esiste")
    void get_evento_by_id_not_found() throws Exception {
        Long eventId=99l;

        when(eventoService.findById(eventId))
                .thenThrow(new EventoNonTrovatoException(eventId));

        mockMvc.perform(get("/api/events/{id}",eventId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errore", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/events -> 201 Created quadno si crea un evento")
    @WithMockUser(username = "operatore", roles = {"OPERATORE"})
    void create_event_success() throws Exception {
        // 1. Prepariamo un JSON valido da inviare nel body della richiesta
        String eventoJson = """
            {
                "titolo": "Concerto Estivo",
                "descrizione": "Musica all'aperto",
                "dataEvento": "2026-12-15T21:00:00",
                "luogo": "Piazza",
                "capienzaMassima": 200
            }
            """;

        // 2. Creiamo l'oggetto DTO che ci aspettiamo venga restituito dal service
        EventoDto eventoCreato = new EventoDto(
                "Concerto Estivo",
                "Musica all'aperto",
                LocalDateTime.of(2026, 12, 15, 21, 0),
                "Piazza",
                200
        );

        // 3. Diciamo a Mockito cosa deve fare quando il service viene chiamato con qualsiasi EventoDto
        when(eventoService.create(any(EventoDto.class))).thenReturn(eventoCreato);

        // 4. Eseguiamo la chiamata POST con MockMvc e verifichiamo il 201 CREATED
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventoJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titolo", is("Concerto Estivo")))
                .andExpect(jsonPath("$.capienzaMassima", is(200)));
    }

    @Test
    @DisplayName("POST /api/events -> 400 Bad Request la data e nel passato")
    @WithMockUser(username = "operatore", roles = {"OPERATORE"})
    void create_event_failed() throws Exception {
        // 1. Prepariamo un JSON valido da inviare nel body della richiesta
        String eventoJson = """
            {
                "titolo": "Concerto Estivo",
                "descrizione": "Musica all'aperto",
                "dataEvento": "2026-08-15T21:00:00",
                "luogo": "Piazza",
                "capienzaMassima": 200
            }
            """;

        // 4. Eseguiamo la chiamata POST e verifichiamo che rispota 400 bad request
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventoJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.dataEvento", is("must be a future date")));
    }
}


