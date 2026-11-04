package com.eventlab.service.client;

import com.eventlab.dto.EventResponseDto;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

@HttpExchange("/api/events")
public interface ServiceClient {


    @GetExchange(value = "/{id}",accept = "application/json")
    EventResponseDto getById(@PathVariable Long id);
}
