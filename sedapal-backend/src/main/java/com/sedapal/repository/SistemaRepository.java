package com.sedapal.repository;

import com.sedapal.model.Sistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SistemaRepository extends JpaRepository<Sistema, Long> {
    
    List<Sistema> findByEstado(Integer estado);
}
