package com.eventlab.service.impl;

import com.eventlab.dto.BookingDto;
import com.eventlab.entity.Booking;
import com.eventlab.exception.BookingNotFound;
import com.eventlab.mapper.BookingMapper;
import com.eventlab.repository.BookingRepository;
import com.eventlab.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;

    @Override
    public List<BookingDto> getBookings(Long eventId) {
        return bookingRepository.findByEventId(eventId)
                .stream()
                .map(BookingMapper::toDto)
                .toList();

    }

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
}
