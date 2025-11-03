package com.sedapal.repository;

import com.sedapal.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    Optional<Usuario> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<Usuario> findByRolAndEstado(Usuario.Rol rol, Boolean estado);
    
    Optional<Usuario> findByEmailAndContrasenaAndEstado(String email, String contrasena, Boolean estado);
}
