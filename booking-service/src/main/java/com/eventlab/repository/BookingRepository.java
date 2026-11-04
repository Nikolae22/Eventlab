package com.eventlab.repository;

import com.eventlab.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking,Long> {

    List<Booking> findByEventId(Long eventId);

    long countByEventId(Long eventId);
}
