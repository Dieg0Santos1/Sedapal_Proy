package com.sedapal.dto;

import com.sedapal.model.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class UsuarioDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CrearAdminRequest {
        @NotBlank(message = "El nombre es requerido")
        private String nombre;
        
        @NotBlank(message = "El apellido es requerido")
        private String apellido;
        
        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        private String email;
        
        @NotBlank(message = "La contraseña es requerida")
        private String contrasena;
        
        @NotNull(message = "El ID del sistema es requerido")
        private Long idSistema;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CrearUsuarioRequest {
        @NotBlank(message = "El nombre es requerido")
        private String nombre;
        
        @NotBlank(message = "El apellido es requerido")
        private String apellido;
        
        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CrearUsuarioConActividadRequest {
        @NotBlank(message = "El nombre es requerido")
        private String nombre;
        
        @NotBlank(message = "El apellido es requerido")
        private String apellido;
        
        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        private String email;
        
        @NotBlank(message = "El nombre de la actividad es requerido")
        private String nombreActividad;
        
        @NotBlank(message = "La abreviatura del sistema es requerida")
        private String sistemaAbrev;
        
        @NotBlank(message = "El nombre del equipo es requerido")
        private String equipoNombre;
        
        @NotNull(message = "El trimestre es requerido")
        private Integer trimestre;
        
        private String fechaMaxima;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioResponse {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private Usuario.Rol rol;
        private String contrasena; // Solo para la respuesta inicial
        private Boolean estado;

        public static UsuarioResponse fromEntity(Usuario usuario) {
            return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol(),
                null, // No devolver contraseña por defecto
                usuario.getEstado()
            );
        }

        public static UsuarioResponse fromEntityWithPassword(Usuario usuario, String contrasena) {
            UsuarioResponse response = fromEntity(usuario);
            response.setContrasena(contrasena);
            return response;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidarCredencialesRequest {
        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        private String email;
        
        @NotBlank(message = "La contraseña es requerida")
        private String contrasena;
    }
}
