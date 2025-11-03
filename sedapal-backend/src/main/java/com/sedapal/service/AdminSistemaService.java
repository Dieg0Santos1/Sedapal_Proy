package com.sedapal.service;

import com.sedapal.model.AdminSistema;
import com.sedapal.model.Sistema;
import com.sedapal.repository.AdminSistemaRepository;
import com.sedapal.repository.SistemaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminSistemaService {

    private final AdminSistemaRepository adminSistemaRepository;
    private final SistemaRepository sistemaRepository;

    /**
     * Obtener todos los sistemas asignados a un administrador
     */
    public List<Sistema> getSistemasByAdmin(Long idAdmin) {
        // Obtener todas las asignaciones del admin
        List<AdminSistema> asignaciones = adminSistemaRepository.findByIdAdminAndEstado(idAdmin, true);
        
        // Extraer los IDs de sistemas
        List<Long> sistemaIds = asignaciones.stream()
                .map(AdminSistema::getIdSistema)
                .collect(Collectors.toList());
        
        if (sistemaIds.isEmpty()) {
            return List.of();
        }
        
        // Obtener los sistemas
        return sistemaRepository.findAllById(sistemaIds);
    }
}
