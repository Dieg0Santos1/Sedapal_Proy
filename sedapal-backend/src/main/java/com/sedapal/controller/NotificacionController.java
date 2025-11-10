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

    // ================= Nuevas notificaciones =================
    public record UsuarioCumplioRequest(
        String adminEmail,
        String usuarioNombre,
        String usuarioEmail,
        String nombreActividad,
        String entregableNombre,
        String sistemaAbrev,
        String equipoNombre,
        String fechaMaxima
    ) {}

    @PostMapping("/usuario-cumplio")
    public ResponseEntity<String> notificarUsuarioCumplio(@RequestBody UsuarioCumplioRequest req) {
        try {
            log.info("📧 UsuarioCumplio -> adminEmail={}, usuario={}, actividad={}", req.adminEmail(), req.usuarioEmail(), req.nombreActividad());
            if (req.adminEmail() == null || req.adminEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("adminEmail requerido");
            }
            emailService.enviarNotificacionUsuarioCumplio(
                req.adminEmail().trim(), req.usuarioNombre(), req.usuarioEmail(),
                req.nombreActividad(), req.entregableNombre(), req.sistemaAbrev(),
                req.equipoNombre(), req.fechaMaxima()
            );
            return ResponseEntity.ok("Notificación enviada al admin");
        } catch (Exception e) {
            log.error("❌ Error al notificar cumplimiento", e);
            String msg = e.getClass().getSimpleName() + ": " + e.getMessage();
            if (e.getCause() != null) msg += " | causa: " + e.getCause().getClass().getSimpleName() + ": " + e.getCause().getMessage();
            return ResponseEntity.internalServerError().body(msg);
        }
    }

    public record ConformeRequest(
        java.util.List<String> usuariosDestino,
        java.util.List<String> superadminsDestino,
        String nombreActividad,
        String entregableNombre,
        String sistemaAbrev,
        String equipoNombre,
        String fechaMaxima
    ) {}

    @PostMapping("/conforme")
    public ResponseEntity<String> notificarConforme(@RequestBody ConformeRequest req) {
        try {
            emailService.enviarNotificacionConforme(
                req.usuariosDestino(), req.superadminsDestino(),
                req.nombreActividad(), req.entregableNombre(), req.sistemaAbrev(),
                req.equipoNombre(), req.fechaMaxima()
            );
            return ResponseEntity.ok("Notificación de conforme enviada");
        } catch (Exception e) {
            log.error("❌ Error al notificar conforme: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // ================= Usuario creado con equipo/gerencia =================
    public record UsuarioCreadoRequest(
        String email,
        String nombreUsuario,
        String contrasena,
        String gerenciaNombre,
        String equipoNombre
    ) {}

    @PostMapping("/usuario-creado")
    public ResponseEntity<String> notificarUsuarioCreado(@RequestBody UsuarioCreadoRequest req) {
        try {
            emailService.enviarUsuarioCreado(
                req.email(), req.nombreUsuario(), req.contrasena(),
                req.gerenciaNombre(), req.equipoNombre()
            );
            return ResponseEntity.ok("Notificación de usuario creado enviada");
        } catch (Exception e) {
            log.error("❌ Error al notificar usuario creado: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // ================= Asignación de sistema a admin =================
    public record AsignacionSistemaRequest(
        String email,
        String nombreAdmin,
        String sistemaAbrev,
        String sistemaNombre
    ) {}

    @PostMapping("/asignacion-sistema")
    public ResponseEntity<String> notificarAsignacionSistema(@RequestBody AsignacionSistemaRequest req) {
        try {
            emailService.enviarAsignacionSistema(
                req.email(), req.nombreAdmin(), req.sistemaAbrev(), req.sistemaNombre()
            );
            return ResponseEntity.ok("Notificación de asignación de sistema enviada");
        } catch (Exception e) {
            log.error("❌ Error al notificar asignación de sistema: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}
