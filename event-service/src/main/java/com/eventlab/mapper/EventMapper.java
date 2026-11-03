package com.eventlab.mapper;

import com.eventlab.dto.EventoDto;
import com.eventlab.entity.Evento;

public class EventMapper {

    public static Evento toEntity(EventoDto eventoDto){
        Evento evento=new Evento();
        evento.setTitolo(eventoDto.titolo());
        evento.setDescrizione(eventoDto.descrizione());
        evento.setDataEvento(eventoDto.dataEvento());
        evento.setLuogo(eventoDto.luogo());
        evento.setCapienzaMassima(eventoDto.capienzaMassima());
        return evento;
    }

    public static EventoDto eventoDto(Evento evento){
        return new EventoDto(
                evento.getTitolo(),
                evento.getDescrizione(),
                evento.getDataEvento(),
                evento.getLuogo(),
                evento.getCapienzaMassima()
        );
    }
}
