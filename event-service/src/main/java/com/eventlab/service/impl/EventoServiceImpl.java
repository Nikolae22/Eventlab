package com.eventlab.service.impl;

import com.eventlab.dto.EventoDto;
import com.eventlab.dto.EventoResponse;
import com.eventlab.entity.Evento;
import com.eventlab.exception.EventoNonTrovatoException;
import com.eventlab.mapper.EventMapper;
import com.eventlab.reposiotry.EventoRepository;
import com.eventlab.service.EventoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventoServiceImpl implements EventoService {

    private final EventoRepository eventoRepository;


    @Transactional(readOnly = true)
    @Override
    public List<EventoResponse> getAll() {
        return eventoRepository.findAll()
                .stream()
                .map(EventMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public EventoResponse findById(Long id) {
        Evento evento=eventoRepository.findById(id)
                .orElseThrow(()->new EventoNonTrovatoException(id));
        return EventMapper.toResponse(evento);
    }

    @Transactional
    @Override
    public EventoDto create(EventoDto eventoDto) {
        Evento evento = EventMapper.toEntity(eventoDto);
        Evento saved = eventoRepository.save(evento);
        return EventMapper.eventoDto(saved);


    }

    @Override
    @Transactional
    public EventoResponse updateById(Long id,EventoResponse eventoResponse) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new EventoNonTrovatoException(id));
        evento.setTitolo(eventoResponse.titolo());
        evento.setDescrizione(eventoResponse.descrizione());
        evento.setCapienzaMassima(eventoResponse.capienzaMassima());
        evento.setLuogo(eventoResponse.luogo());
        evento.setDataEvento(eventoResponse.dataEvento());
        Evento saved = eventoRepository.save(evento);
        return EventMapper.toResponse(saved);
    }
}
