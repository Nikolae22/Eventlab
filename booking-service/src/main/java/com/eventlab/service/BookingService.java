package com.eventlab.service;

import com.eventlab.dto.BookingDto;

import java.util.List;

public interface BookingService  {


    List<BookingDto> getBookings(Long eventId);

    void deleteBooking(Long id);

    long getNumberOfBookingsForEvent(Long eventId);

}
