package com.eventlab.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String titolo;
    private String descrizione;
    @Column(nullable = false)
    private LocalDateTime dataEvento;
    @Column(nullable = false)
    private String luogo;
    @Column(nullable = false)
    private Integer capienzaMassima;



}
