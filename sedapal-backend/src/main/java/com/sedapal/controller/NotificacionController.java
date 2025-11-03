package com.sedapal.controller;

import com.sedapal.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@Slf4j
public class NotificacionController {

    private final EmailService emailService;

    /**
     * DTO para envío de notificación de actividad
     */
    public record NotificacionActividadRequest(
        String email,
        String nombreUsuario,
        String nombreActividad,
        String sistemaAbrev,
        String equipoNombre,
        int trimestre,
        String fechaMaxima
    ) {}

    /**
     * Enviar notificación de actividad asignada
     */
    @PostMapping("/actividad-asignada")
    public ResponseEntity<String> enviarNotificacionActividad(
            @RequestBody NotificacionActividadRequest request) {
        try {
            log.info("📧 Enviando notificación de actividad a: {}", request.email());
            
            emailService.enviarNotificacionActividad(
                request.email(),
                request.nombreUsuario(),
                request.nombreActividad(),
                request.sistemaAbrev(),
                request.equipoNombre(),
                request.trimestre(),
                request.fechaMaxima()
            );
            
            return ResponseEntity.ok("Notificación enviada exitosamente");
        } catch (Exception e) {
            log.error("❌ Error al enviar notificación: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body("Error al enviar notificación: " + e.getMessage());
        }
    }

    /**
     * Endpoint de prueba para verificar configuración de email
     */
    @PostMapping("/test")
    public ResponseEntity<String> testEmail(@RequestBody TestEmailRequest request) {
        try {
            log.info("🧪 Probando envío de email a: {}", request.email());
            
            emailService.enviarEmailSimple(
                request.email(),
                "Test - Sistema SEDAPAL",
                "Este es un email de prueba del sistema SEDAPAL. Si recibes este mensaje, la configuración de correo funciona correctamente."
            );
            
            return ResponseEntity.ok("Email de prueba enviado exitosamente a " + request.email());
        } catch (Exception e) {
            log.error("❌ Error completo al enviar email de prueba:", e);
            String errorDetails = e.getClass().getName() + ": " + e.getMessage();
            if (e.getCause() != null) {
                errorDetails += " | Causa: " + e.getCause().getClass().getName() + ": " + e.getCause().getMessage();
            }
            return ResponseEntity.internalServerError()
                    .body("Error al enviar email: " + errorDetails);
        }
    }

    public record TestEmailRequest(String email) {}
}
