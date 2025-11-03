package com.sedapal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tb_sistemas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "desc_sistema", nullable = false)
    private String descSistema;

    @Column(name = "abrev")
    private String abrev;

    @Column(name = "administrador")
    private String administrador;

    @Column(name = "suplente")
    private String suplente;

    @Column(nullable = false)
    private Integer estado;
}
