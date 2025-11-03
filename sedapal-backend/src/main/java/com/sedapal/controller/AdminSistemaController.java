package com.sedapal.controller;

import com.sedapal.model.Sistema;
import com.sedapal.service.AdminSistemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin-sistemas")
@RequiredArgsConstructor
@Slf4j
public class AdminSistemaController {

    private final AdminSistemaService adminSistemaService;

    /**
     * Obtener sistemas asignados a un administrador
     * GET /api/admin-sistemas/admin/{idAdmin}
     */
    @GetMapping("/admin/{idAdmin}")
    public ResponseEntity<List<Sistema>> getSistemasByAdmin(@PathVariable Long idAdmin) {
        log.info("📋 Obteniendo sistemas del admin ID: {}", idAdmin);
        List<Sistema> sistemas = adminSistemaService.getSistemasByAdmin(idAdmin);
        return ResponseEntity.ok(sistemas);
    }
}
