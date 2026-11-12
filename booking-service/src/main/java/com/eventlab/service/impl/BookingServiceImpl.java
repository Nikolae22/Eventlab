package com.eventlab.service.impl;

import com.eventlab.dto.BookingDto;
import com.eventlab.dto.BookingResponse;
import com.eventlab.dto.EventResponseDto;
import com.eventlab.entity.Booking;
import com.eventlab.exception.BookingNotFound;
import com.eventlab.exception.EventoCompletoException;
import com.eventlab.exception.EventoPassatoException;
import com.eventlab.exception.PrenotazioneDuplicataException;
import com.eventlab.mapper.BookingMapper;
import com.eventlab.repository.BookingRepository;
import com.eventlab.service.BookingService;
import com.eventlab.service.client.ServiceClient;
import jdk.jfr.Event;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ServiceClient serviceClient;


    /**
     * metodo che richiama il Evento serviche per pvedere se esiste
     * fa i check sulla data , email, numero prenotati
     * @param bookingDto
     * @return
     */
    @Transactional
    @Override
    public BookingResponse createBooking(BookingDto bookingDto) {
        EventResponseDto evento = serviceClient.getById(bookingDto.eventId());

        if (evento.dataEvento().isBefore(LocalDateTime.now())){
            throw new EventoPassatoException("Non puoi prenotare un evento finit");
        }

        if (bookingRepository.existsByEventIdAndParticipantEmail(evento.id(),bookingDto.participantEmail())){
            throw new PrenotazioneDuplicataException("Ce gia una registrzione con qeusta email "+
                    bookingDto.participantEmail());
        }

        long prenotati=bookingRepository.countByEventId(evento.id());

        if (prenotati >=evento.capienzaMassima()){
            throw new EventoCompletoException("Levento e al completo");
        }

        Booking booking=BookingMapper.toEntity(bookingDto);
        booking.setCreatedAt(LocalDateTime.now());
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    @Override
    public List<BookingResponse> getBookings(Long eventId) {
        return bookingRepository.findByEventId(eventId)
                .stream()
                .map(BookingMapper::toResponse)
                .toList();

    }

    @Transactional
    @Override
    public void deleteBooking(Long id) {
        Booking booking=bookingRepository.findById(id)
                .orElseThrow(()->new BookingNotFound(id));
        bookingRepository.delete(booking);
    }

    @Override
    public long getNumberOfBookingsForEvent(Long eventId) {
        return bookingRepository.countByEventId(eventId);
    }

    /**
     * metodo per creare csv file per un evento con tutti i prenotati
     * @param eventId
     * @return
     */
    @Override
    public String generateCsvForEvent(Long eventId) {
        //recupero le prenotazioni per quell evento
        List<BookingResponse> bookings=getBookings(eventId);

        //costruiamo il csv
        StringBuilder csv=new StringBuilder();
        csv.append("ID,EventID,Participiante Name,Participiante Email\n");

        for (BookingResponse b : bookings){
            csv.append(b.id()).append(",")
                    .append(b.eventId()).append(",")
                    .append("\"").append(b.participantName()).append("\",")
                    .append(b.participantEmail()).append(",")
                    .append("\n");
        }

        return csv.toString();
    }
}
