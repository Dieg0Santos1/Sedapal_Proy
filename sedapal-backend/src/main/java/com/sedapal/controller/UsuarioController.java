package com.sedapal.controller;

import com.sedapal.dto.UsuarioDTO;
import com.sedapal.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Slf4j
public class UsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Crear administrador
     * POST /api/usuarios/admin
     */
    @PostMapping("/admin")
    public ResponseEntity<?> crearAdministrador(@Valid @RequestBody UsuarioDTO.CrearAdminRequest request) {
        try {
            System.out.println("\n\n========================================");
            System.out.println("📝 RECIBIENDO REQUEST CREAR ADMIN");
            System.out.println("Nombre: " + request.getNombre());
            System.out.println("Apellido: " + request.getApellido());
            System.out.println("Email: " + request.getEmail());
            System.out.println("ID Sistema: " + request.getIdSistema());
            System.out.println("========================================\n\n");
            
            log.info("📝 Creando administrador: {}", request.getEmail());
            
            UsuarioDTO.UsuarioResponse response = usuarioService.crearAdministrador(
                request.getNombre(),
                request.getApellido(),
                request.getEmail(),
                request.getContrasena(),
                request.getIdSistema()
            );
            
            System.out.println("\n✅ ADMIN CREADO EXITOSAMENTE\n");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.out.println("\n\n========================================");
            System.out.println("❌ ERROR AL CREAR ADMINISTRADOR");
            System.out.println("Mensaje: " + e.getMessage());
            e.printStackTrace();
            System.out.println("========================================\n\n");
            
            log.error("❌ Error al crear administrador: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Crear usuario
     * POST /api/usuarios/usuario
     */
    @PostMapping("/usuario")
    public ResponseEntity<?> crearUsuario(@Valid @RequestBody UsuarioDTO.CrearUsuarioRequest request) {
        try {
            log.info("📝 Creando usuario: {}", request.getEmail());
            
            UsuarioDTO.UsuarioResponse response = usuarioService.crearUsuario(
                request.getNombre(),
                request.getApellido(),
                request.getEmail()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("❌ Error al crear usuario: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Crear usuario con actividad asignada
     * POST /api/usuarios/usuario-con-actividad
     */
    @PostMapping("/usuario-con-actividad")
    public ResponseEntity<?> crearUsuarioConActividad(
            @Valid @RequestBody UsuarioDTO.CrearUsuarioConActividadRequest request) {
        try {
            log.info("📝 Creando usuario con actividad: {}", request.getEmail());
            
            UsuarioDTO.UsuarioResponse response = usuarioService.crearUsuarioConActividad(
                request.getNombre(),
                request.getApellido(),
                request.getEmail(),
                request.getNombreActividad(),
                request.getSistemaAbrev(),
                request.getEquipoNombre(),
                request.getTrimestre(),
                request.getFechaMaxima()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("❌ Error al crear usuario con actividad: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Validar credenciales
     * POST /api/usuarios/validar
     */
    @PostMapping("/validar")
    public ResponseEntity<?> validarCredenciales(@Valid @RequestBody UsuarioDTO.ValidarCredencialesRequest request) {
        try {
            UsuarioDTO.UsuarioResponse response = usuarioService.validarCredenciales(
                request.getEmail(),
                request.getContrasena()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Credenciales inválidas para: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales inválidas"));
        }
    }

    /**
     * Obtener usuario por email
     * GET /api/usuarios/{email}
     */
    @GetMapping("/{email}")
    public ResponseEntity<?> obtenerPorEmail(@PathVariable String email) {
        try {
            UsuarioDTO.UsuarioResponse response = usuarioService.obtenerPorEmail(email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Usuario no encontrado"));
        }
    }

    /**
     * Obtener todos los administradores
     * GET /api/usuarios/admin/all
     */
    @GetMapping("/admin/all")
    public ResponseEntity<List<UsuarioDTO.UsuarioResponse>> obtenerAdministradores() {
        List<UsuarioDTO.UsuarioResponse> admins = usuarioService.obtenerAdministradores();
        return ResponseEntity.ok(admins);
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "OK", "service", "UsuarioService"));
    }
}
