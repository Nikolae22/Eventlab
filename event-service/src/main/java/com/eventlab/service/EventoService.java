package com.eventlab.service;

import com.eventlab.dto.EventoDto;

import java.util.List;

public interface EventoService {

    List<EventoDto> getAll();

    EventoDto findById(Long id);

    EventoDto create(EventoDto eventoDto);

    EventoDto updateById(Long id, EventoDto eventoDto);

}
