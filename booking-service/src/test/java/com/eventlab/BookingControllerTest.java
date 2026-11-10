package com.eventlab;

import com.eventlab.dto.BookingDto;
import com.eventlab.dto.BookingResponse;
import com.eventlab.exception.BookingNotFound;
import com.eventlab.service.BookingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisplayName("EventService Controller test")
@ActiveProfiles("test")
public class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;


    private ObjectMapper objectMapper=new ObjectMapper();

    @MockitoBean
    private BookingService bookingService;

    @Test
    @DisplayName("GET /pi/bookings/event/{eventId} ->200 Elenco Prenotazioni")
    void get_list_bookings_for_event() throws Exception {

        //given
        Long eventId= 1L;
        List<BookingResponse> bookingsFinte = List.of(
                new BookingResponse(10L, eventId, "Mario Rossi", "mario.rossi@email.com", LocalDateTime.now()),
                new BookingResponse(11L, eventId, "Luigi Verdi", "luigi.verdi@email.com", LocalDateTime.now())
        );

        //diciamo a mokito cosa restituire quando viene chiamato il service
        when(bookingService.getBookings(eventId))
                .thenReturn(bookingsFinte);

        //essequiamo la get con mockmvc e verifichiamo la rispota
        mockMvc.perform(get("/api/bookings/event/{eventId}",eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()", is(2)))
                .andExpect(jsonPath("$[0].id", is(10)))
                .andExpect(jsonPath("$[0].participantName", is("Mario Rossi")))
                .andExpect(jsonPath("$[0].participantEmail", is("mario.rossi@email.com")))
                .andExpect(jsonPath("$[1].participantName", is("Luigi Verdi")));
    }

    @Test
    @DisplayName("DELETE /api/bookings/{id} -> 204 No Content quando l'operatore elimina una prenotazione")
    @WithMockUser(username = "operatore", roles = {"OPERATORE"})
    void delete_booking_success() throws Exception {
        //given
        Long bookingId = 10L;
        // Configuriamo il mock per non fare nulla (metodo void)
        doNothing().when(bookingService).deleteBooking(bookingId);

        mockMvc.perform(delete("/api/bookings/{id}", bookingId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /api/bookings -> 200/201 quando si crea una prenotazione valida")
    void create_booking_success() throws Exception {
        // 1. Prepariamo il DTO di richiesta (adatta i campi in base al tuo BookingDto)
        BookingDto requestDto = new BookingDto(1L, "Anna Bianchi", "anna.bianchi@email.com");

        // 2. Prepariamo la risposta attesa dal service
        BookingResponse responseDto = new BookingResponse(
                1L, 1L, "Anna Bianchi", "anna.bianchi@email.com", LocalDateTime.now()
        );

        when(bookingService.createBooking(any(BookingDto.class))).thenReturn(responseDto);

        // 3. Eseguiamo la POST convertendo l'oggetto in JSON con l'ObjectMapper
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.participantName", is("Anna Bianchi")))
                .andExpect(jsonPath("$.participantEmail", is("anna.bianchi@email.com")));
    }

    @Test
    @DisplayName("POST /api/bookings -> 400 Bad Request se i dati non sono validi (es. email non valida)")
    void create_booking_invalid_data() throws Exception {
        // Given (Invalid data: empty name and malformed email)
        BookingDto requestDto = new BookingDto(1L, "", "email-non-valida");

        // 2. Eseguiamo la POST e verifichiamo che risponda 400 Bad Request
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.participantName", is("Name is Required")))
                .andExpect(jsonPath("$.participantEmail", is("Email non valida")));
    }

    @Test
    @DisplayName("GET /api/bookings/event/{eventId}/count -> returns 200 OK with bookings count")
    void shouldReturnBookingsCount_whenEventIdExists() throws Exception {
        // Given
        Long eventId = 1L;
        Long expectedCount = 5L;

        when(bookingService.getNumberOfBookingsForEvent(eventId)).thenReturn(expectedCount);

        // When & Then
        mockMvc.perform(get("/api/bookings/event/{eventId}/count", eventId))
                .andExpect(status().isOk())
                .andExpect(content().string("5")); // Restituisce un Long puro, quindi verifichiamo il contenuto testuale/numerico
    }

    @Test
    @DisplayName("DELETE /api/bookings/{id} -> returns 404 Not Found when booking id does not exist")
    @WithMockUser(username = "operatore", roles = {"OPERATORE"})
    void shouldReturnNotFound_whenBookingIdDoesNotExist() throws Exception {
        // Given
        Long nonExistentId = 999L;
        // Supponendo che il service lanci un'eccezione custom (es. BookingNotFoundException)
        doThrow(new BookingNotFound(nonExistentId))
                .when(bookingService).deleteBooking(nonExistentId);

        // When & Then
        mockMvc.perform(delete("/api/bookings/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/bookings/event/{eventId}/export -> returns 200 OK with CSV file when user is operator")
    @WithMockUser(username = "operatore", roles = {"OPERATORE"})
    void should_export_csv_successfully_when_user_is_operator() throws Exception {
        //given
    Long eventId=1L;
    String mockCsv = "ID,EventID,Participant Name\n10,1,Mario Rossi";

        when(bookingService.generateCsvForEvent(eventId)).thenReturn(mockCsv);

        // When & Then
        mockMvc.perform(get("/api/bookings/event/{eventId}/export",eventId))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bookings_event_1.csv"))
                .andExpect(content().string(mockCsv));
    }

}
