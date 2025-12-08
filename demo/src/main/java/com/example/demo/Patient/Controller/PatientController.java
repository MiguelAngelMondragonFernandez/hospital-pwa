package com.example.demo.Patient.Controller;

import com.example.demo.Patient.Entity.Patient;
import com.example.demo.Patient.Service.PatientService;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patient")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@AllArgsConstructor
public class PatientController {

    private final PatientService patientService;

    /**
     * Obtener todos los pacientes
     * GET /api/patient/all
     */
    @GetMapping("/all")
    public ResponseEntity<Message> getAll() {
        return patientService.findAll();
    }

    /**
     * Obtener un paciente por ID (incluye cama asignada si existe)
     * GET /api/patient/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Message> getById(@PathVariable("id") Long id) {
        return patientService.findById(id);
    }

    /**
     * Crear un nuevo paciente
     * POST /api/patient/save
     */
    @PostMapping("/save")
    public ResponseEntity<Message> save(@RequestBody Patient dto) {
        return patientService.save(dto);
    }

    /**
     * Actualizar un paciente existente
     * PUT /api/patient/update
     */
    @PutMapping("/update")
    public ResponseEntity<Message> update(@RequestBody Patient dto) {
        return patientService.update(dto);
    }

    /**
     * Eliminar un paciente
     * DELETE /api/patient/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Message> delete(@PathVariable("id") Long id) {
        return patientService.delete(id);
    }

    /**
     * Asignar una cama a un paciente
     * PUT /api/patient/{patientId}/assign-bed/{camaId}
     * Valida que la cama esté libre
     */
    @PutMapping("/{patientId}/assign-bed/{camaId}")
    public ResponseEntity<Message> assignBed(
            @PathVariable Long patientId,
            @PathVariable Long camaId
    ) {
        return patientService.assignBed(patientId, camaId);
    }

    /**
     * Desasignar la cama de un paciente
     * PUT /api/patient/{patientId}/unassign-bed
     * Libera la cama automáticamente
     */
    @PutMapping("/{patientId}/unassign-bed")
    public ResponseEntity<Message> unassignBed(@PathVariable Long patientId) {
        return patientService.unassignBed(patientId);
    }

    /**
     * Cambiar el estado de un paciente
     * PUT /api/patient/{patientId}/change-status/{status}
     * Estados válidos: activo, inactivo, alta
     * Si es 'alta', libera la cama automáticamente
     */
    @PutMapping("/{patientId}/change-status/{status}")
    public ResponseEntity<Message> changeStatus(
            @PathVariable Long patientId,
            @PathVariable String status
    ) {
        return patientService.changeStatus(patientId, status);
    }

    /**
     * Obtener todos los pacientes que tienen cama asignada
     * GET /api/patient/with-bed
     */
    @GetMapping("/with-bed")
    public ResponseEntity<Message> getPatientsWithBed() {
        return patientService.findPatientsWithBed();
    }

    /**
     * Obtener todos los pacientes que NO tienen cama asignada
     * GET /api/patient/without-bed
     */
    @GetMapping("/without-bed")
    public ResponseEntity<Message> getPatientsWithoutBed() {
        return patientService.findPatientsWithoutBed();
    }
}