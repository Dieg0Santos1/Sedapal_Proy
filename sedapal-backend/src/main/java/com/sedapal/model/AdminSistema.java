package com.sedapal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_admin_sistemas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_admin_sistema")
    private Long id;

    @Column(name = "id_admin", nullable = false)
    private Long idAdmin;

    @Column(name = "id_sistema", nullable = false)
    private Long idSistema;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    @Column(nullable = false)
    private Boolean estado = true;

    @PrePersist
    protected void onCreate() {
        fechaAsignacion = LocalDateTime.now();
        if (estado == null) {
            estado = true;
        }
    }
}
