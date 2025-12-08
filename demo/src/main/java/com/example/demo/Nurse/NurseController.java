package com.example.demo.Nurse;

import com.example.demo.User.Entity.User;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/nurse")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@AllArgsConstructor
public class NurseController {

    private final NurseService service;

    @PostMapping("/save")
    public ResponseEntity<Message> saveNurse(@RequestBody User user) {
        return service.saveNurse(user);
    }

    @GetMapping("/all")
    public ResponseEntity<Message> getAllNurses() {
        return service.getAllNurses();
    }

    @GetMapping("/stretchers")
    public ResponseEntity<Message> getAllStretchers() {
        return service.getAllStretchers();
    }

    /**
     * Asignar una cama a un enfermero (inicia turno automáticamente)
     * POST /api/nurse/{nurseId}/assign-bed/{bedId}
     */
    @PostMapping("/{nurseId}/assign-bed/{bedId}")
    public ResponseEntity<Message> assignBedToNurse(
            @PathVariable Long nurseId,
            @PathVariable Long bedId
    ) {
        return service.assignBedToNurse(nurseId, bedId);
    }

    /**
     * Obtener todas las asignaciones de un enfermero
     * GET /api/nurse/{nurseId}/assignments
     */
    @GetMapping("/{nurseId}/assignments")
    public ResponseEntity<Message> getAssignmentsByNurse(@PathVariable Long nurseId) {
        return service.getAssignmentsByNurse(nurseId);
    }

    /**
     * Obtener solo las asignaciones activas de un enfermero
     * GET /api/nurse/{nurseId}/assignments/active
     */
    @GetMapping("/{nurseId}/assignments/active")
    public ResponseEntity<Message> getActiveAssignmentsByNurse(@PathVariable Long nurseId) {
        return service.getActiveAssignmentsByNurse(nurseId);
    }

    /**
     * Obtener todas las asignaciones de una cama específica
     * GET /api/nurse/bed/{bedId}/assignments
     */
    @GetMapping("/bed/{bedId}/assignments")
    public ResponseEntity<Message> getAssignmentsByBed(@PathVariable Long bedId) {
        return service.getAssignmentsByBed(bedId);
    }

    /**
     * Obtener todas las asignaciones activas del sistema
     * GET /api/nurse/assignments/active
     */
    @GetMapping("/assignments/active")
    public ResponseEntity<Message> getAllActiveAssignments() {
        return service.getAllActiveAssignments();
    }

    /**
     * Iniciar turno para una asignación específica
     * PUT /api/nurse/assignment/{assignmentId}/start-shift
     */
    @PutMapping("/assignment/{assignmentId}/start-shift")
    public ResponseEntity<Message> startShift(@PathVariable Long assignmentId) {
        return service.startShift(assignmentId);
    }

    /**
     * Cerrar turno para una asignación específica
     * PUT /api/nurse/assignment/{assignmentId}/end-shift
     */
    @PutMapping("/assignment/{assignmentId}/end-shift")
    public ResponseEntity<Message> endShift(@PathVariable Long assignmentId) {
        return service.endShift(assignmentId);
    }

    /**
     * Cerrar todos los turnos activos de un enfermero
     * PUT /api/nurse/{nurseId}/end-all-shifts
     */
    @PutMapping("/{nurseId}/end-all-shifts")
    public ResponseEntity<Message> endAllShiftsForNurse(@PathVariable Long nurseId) {
        return service.endAllShiftsForNurse(nurseId);
    }

    /**
     * Eliminar una asignación (solo si el turno está cerrado)
     * DELETE /api/nurse/assignment/{assignmentId}
     */
    @DeleteMapping("/assignment/{assignmentId}")
    public ResponseEntity<Message> deleteAssignment(@PathVariable Long assignmentId) {
        return service.deleteAssignment(assignmentId);
    }
}