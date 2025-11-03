package com.sedapal.service;

import com.sedapal.dto.UsuarioDTO;
import com.sedapal.model.AdminSistema;
import com.sedapal.model.Usuario;
import com.sedapal.repository.AdminSistemaRepository;
import com.sedapal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final AdminSistemaRepository adminSistemaRepository;
    private final EmailService emailService;
    private final Random random = new Random();

    /**
     * Crear administrador y asignarlo a un sistema
     */
    @Transactional
    public UsuarioDTO.UsuarioResponse crearAdministrador(String nombre, String apellido, String email, String contrasena, Long idSistema) {
        // Validar que no exista el email
        if (usuarioRepository.existsByEmail(email)) {
            throw new RuntimeException("Ya existe un usuario con el email: " + email);
        }

        // Crear usuario con la contraseña proporcionada
        Usuario admin = new Usuario();
        admin.setNombre(nombre);
        admin.setApellido(apellido);
        admin.setEmail(email);
        admin.setContrasena(contrasena);
        admin.setRol(Usuario.Rol.admin);
        admin.setEstado(true);

        Usuario savedAdmin = usuarioRepository.save(admin);
        log.info("✅ Administrador creado: {} (ID: {})", email, savedAdmin.getId());

        // Asignar sistema al administrador
        AdminSistema adminSistema = new AdminSistema();
        adminSistema.setIdAdmin(savedAdmin.getId());
        adminSistema.setIdSistema(idSistema);
        adminSistema.setEstado(true);
        
        adminSistemaRepository.save(adminSistema);
        log.info("✅ Sistema {} asignado al administrador {}", idSistema, savedAdmin.getId());

        return UsuarioDTO.UsuarioResponse.fromEntity(savedAdmin);
    }

    /**
     * Crear usuario normal y enviar credenciales por email
     */
    @Transactional
    public UsuarioDTO.UsuarioResponse crearUsuario(String nombre, String apellido, String email) {
        // Validar que no exista el email
        if (usuarioRepository.existsByEmail(email)) {
            throw new RuntimeException("Ya existe un usuario con el email: " + email);
        }

        // Generar contraseña: User + inicial nombre + inicial apellido + 2 dígitos
        String contrasena = generarContrasenaUsuario(nombre, apellido);

        // Crear usuario
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        usuario.setEmail(email);
        usuario.setContrasena(contrasena);
        usuario.setRol(Usuario.Rol.usuario);
        usuario.setEstado(true);

        Usuario savedUsuario = usuarioRepository.save(usuario);
        log.info("✅ Usuario creado: {} (ID: {}) - Contraseña: {}", email, savedUsuario.getId(), contrasena);

        // Enviar credenciales por email
        try {
            emailService.enviarCredenciales(email, nombre, apellido, contrasena, Usuario.Rol.usuario);
            log.info("✅ Email de credenciales enviado a: {}", email);
        } catch (Exception e) {
            log.error("❌ Error al enviar email a {}: {}", email, e.getMessage());
            // No fallar la creación si falla el email
        }

        return UsuarioDTO.UsuarioResponse.fromEntityWithPassword(savedUsuario, contrasena);
    }

    /**
     * Crear usuario con actividad asignada y enviar email con credenciales + detalles de actividad
     */
    @Transactional
    public UsuarioDTO.UsuarioResponse crearUsuarioConActividad(String nombre, String apellido, 
                                                                String email, String nombreActividad,
                                                                String sistemaAbrev, String equipoNombre,
                                                                int trimestre, String fechaMaxima) {
        // Validar que no exista el email
        if (usuarioRepository.existsByEmail(email)) {
            throw new RuntimeException("Ya existe un usuario con el email: " + email);
        }

        // Generar contraseña: User + inicial nombre + inicial apellido + 2 dígitos
        String contrasena = generarContrasenaUsuario(nombre, apellido);

        // Crear usuario
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        usuario.setEmail(email);
        usuario.setContrasena(contrasena);
        usuario.setRol(Usuario.Rol.usuario);
        usuario.setEstado(true);

        Usuario savedUsuario = usuarioRepository.save(usuario);
        log.info("✅ Usuario creado con actividad: {} (ID: {}) - Contraseña: {}", 
                 email, savedUsuario.getId(), contrasena);

        // Enviar credenciales + actividad por email
        try {
            emailService.enviarCredencialesConActividad(
                email, nombre, apellido, contrasena, 
                nombreActividad, sistemaAbrev, equipoNombre, trimestre, fechaMaxima
            );
            log.info("✅ Email de credenciales + actividad enviado a: {}", email);
        } catch (Exception e) {
            log.error("❌ Error al enviar email a {}: {}", email, e.getMessage());
            // No fallar la creación si falla el email
        }

        return UsuarioDTO.UsuarioResponse.fromEntityWithPassword(savedUsuario, contrasena);
    }

    /**
     * Validar credenciales de usuario
     */
    public UsuarioDTO.UsuarioResponse validarCredenciales(String email, String contrasena) {
        Usuario usuario = usuarioRepository
                .findByEmailAndContrasenaAndEstado(email, contrasena, true)
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        log.info("✅ Usuario autenticado: {} (Rol: {})", email, usuario.getRol());
        return UsuarioDTO.UsuarioResponse.fromEntity(usuario);
    }

    /**
     * Obtener usuario por email
     */
    public UsuarioDTO.UsuarioResponse obtenerPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        return UsuarioDTO.UsuarioResponse.fromEntity(usuario);
    }

    /**
     * Obtener todos los administradores activos
     */
    public List<UsuarioDTO.UsuarioResponse> obtenerAdministradores() {
        return usuarioRepository.findByRolAndEstado(Usuario.Rol.admin, true)
                .stream()
                .map(UsuarioDTO.UsuarioResponse::fromEntity)
                .toList();
    }

    /**
     * Generar contraseña para administrador
     * Formato: Admin + inicial nombre + inicial apellido + 2 dígitos
     */
    private String generarContrasenaAdmin(String nombre, String apellido) {
        char inicialNombre = Character.toUpperCase(nombre.charAt(0));
        char inicialApellido = Character.toUpperCase(apellido.charAt(0));
        int numero = 10 + random.nextInt(90); // 10-99
        
        return "Admin" + inicialNombre + inicialApellido + numero;
    }

    /**
     * Generar contraseña para usuario
     * Formato: User + inicial nombre + inicial apellido + 2 dígitos
     */
    private String generarContrasenaUsuario(String nombre, String apellido) {
        char inicialNombre = Character.toUpperCase(nombre.charAt(0));
        char inicialApellido = Character.toUpperCase(apellido.charAt(0));
        int numero = 10 + random.nextInt(90); // 10-99
        
        return "User" + inicialNombre + inicialApellido + numero;
    }
}
