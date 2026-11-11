package com.eventlab.service;

import com.eventlab.dto.EventoDto;
import com.eventlab.dto.EventoResponse;

import java.util.List;

public interface EventoService {

    List<EventoResponse> getAll();

    EventoResponse findById(Long id);

    EventoDto create(EventoDto eventoDto);

    EventoResponse updateById(Long id, EventoResponse eventoResponse);

}
