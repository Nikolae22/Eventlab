package com.eventlab.service;

import com.eventlab.dto.EventoDto;
import com.eventlab.dto.EventoResponse;

import java.util.List;

public interface EventoService {

    List<EventoDto> getAll();

    EventoResponse findById(Long id);

    EventoDto create(EventoDto eventoDto);

    EventoDto updateById(Long id, EventoDto eventoDto);

}
