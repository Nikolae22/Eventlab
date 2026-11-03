package com.eventlab.mapper;

import com.eventlab.dto.BookingDto;
import com.eventlab.entity.Booking;

public class BookingMapper {

    public static Booking toEntity(BookingDto bookingDto){
        Booking booking=new Booking();
        booking.setEventId(bookingDto.eventId());
        booking.setParticipantEmail(bookingDto.participantEmail());
        booking.setParticipantName(bookingDto.participantName());

        return booking;
    }

    public static BookingDto toDto(Booking booking){
        return new BookingDto(
                booking.getEventId(),
                booking.getParticipantName(),
                booking.getParticipantEmail()
        );
    }
}
