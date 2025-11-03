package com.sedapal.repository;

import com.sedapal.model.AdminSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminSistemaRepository extends JpaRepository<AdminSistema, Long> {
    
    List<AdminSistema> findByIdAdminAndEstado(Long idAdmin, Boolean estado);
    
    List<AdminSistema> findByIdSistemaAndEstado(Long idSistema, Boolean estado);
    
    Optional<AdminSistema> findByIdAdminAndIdSistemaAndEstado(Long idAdmin, Long idSistema, Boolean estado);
    
    boolean existsByIdAdminAndIdSistemaAndEstado(Long idAdmin, Long idSistema, Boolean estado);
}
