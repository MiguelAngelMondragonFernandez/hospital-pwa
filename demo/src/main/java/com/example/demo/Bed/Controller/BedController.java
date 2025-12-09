package com.example.demo.Bed.Controller;

import com.example.demo.Bed.Entity.Bed;
import com.example.demo.Bed.Service.BedService;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bed")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@AllArgsConstructor
public class BedController {

    private final BedService bedService;

    /**
     * Obtener todas las camas
     * GET /api/bed/all
     */
    @GetMapping("/all")
    public ResponseEntity<Message> getAll() {
        return bedService.findAll();
    }

    /**
     * Obtener una cama por ID (incluye paciente asignado si existe)
     * GET /api/bed/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Message> getById(@PathVariable("id") Long id) {
        return bedService.findById(id);
    }

    /**
     * Crear una nueva cama
     * POST /api/bed/save
     */
    @PostMapping("/save")
    public ResponseEntity<Message> save(@RequestBody Bed dto) {
        return bedService.save(dto);
    }

    /**
     * Actualizar una cama existente
     * PUT /api/bed/update
     */
    @PutMapping("/update")
    public ResponseEntity<Message> update(@RequestBody Bed dto) {
        return bedService.update(dto);
    }

    /**
     * Eliminar una cama
     * DELETE /api/bed/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Message> delete(@PathVariable("id") Long id) {
        return bedService.delete(id);
    }

    /**
     * Cambiar el estado de una cama
     * PUT /api/bed/{bedId}/change-status/{status}
     * Estados válidos: libre, ocupada, limpieza, mantenimiento
     */
    @PutMapping("/{bedId}/change-status/{status}")
    public ResponseEntity<Message> changeStatus(
            @PathVariable Long bedId,
            @PathVariable String status
    ) {
        return bedService.changeStatus(bedId, status);
    }

    /**
     * Asignar un paciente a una cama
     * POST /api/bed/{camaId}/asignar-paciente/{pacienteId}
     * Solo funciona si la cama está libre
     */
    @PostMapping("/{camaId}/asignar-paciente/{pacienteId}")
    public ResponseEntity<Message> asignarPaciente(
            @PathVariable Long camaId,
            @PathVariable Long pacienteId
    ) {
        return bedService.asignarPacienteACama(camaId, pacienteId);
    }

    /**
     * Liberar una cama (remover paciente)
     * PUT /api/bed/{camaId}/liberar
     * Cambia el estado a libre y desvincula el paciente
     */
    @PutMapping("/{camaId}/liberar")
    public ResponseEntity<Message> liberarCama(@PathVariable Long camaId) {
        return bedService.liberarCama(camaId);
    }

    /**
     * Generar código QR para una cama
     * POST /api/bed/{camaId}/generar-qr
     * Genera la imagen física y guarda la URL en la BD
     */
    @PostMapping("/{camaId}/generar-qr")
    public ResponseEntity<Message> generarQr(@PathVariable Long camaId) {
        return bedService.generarQrCama(camaId);
    }

    /**
     * Obtener información del paciente asignado a una cama
     * GET /api/bed/{bedId}/paciente
     * Este endpoint es llamado después de escanear el QR
     */
    @GetMapping("/{bedId}/paciente")
    public ResponseEntity<Message> getPatientInfo(@PathVariable Long bedId) {
        return bedService.getPatientByBedId(bedId);
    }
}