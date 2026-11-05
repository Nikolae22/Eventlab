package com.eventlab.service;

import com.eventlab.dto.BookingDto;
import com.eventlab.dto.BookingResponse;

import java.util.List;

public interface BookingService  {

    BookingResponse createBooking(BookingDto bookingDto);

    List<BookingResponse> getBookings(Long eventId);

    void deleteBooking(Long id);

    long getNumberOfBookingsForEvent(Long eventId);

}
