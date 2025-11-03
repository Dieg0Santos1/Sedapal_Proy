package com.sedapal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String contrasena;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Rol rol;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(nullable = false)
    private Boolean estado = true;

    public enum Rol {
        superadmin, admin, usuario
    }

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        if (estado == null) {
            estado = true;
        }
    }
}
