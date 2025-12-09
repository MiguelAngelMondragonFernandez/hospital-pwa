package com.example.demo.Nurse;

import com.example.demo.Bed.Entity.Bed;
import com.example.demo.Bed.Entity.BedRepository;
import com.example.demo.Patient.Entity.Patient;
import com.example.demo.User.Entity.User;
import com.example.demo.User.Service.Repository;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Data
@AllArgsConstructor
@Transactional
public class NurseService {

    private final Repository userRepository;
    private final NurseAssignmentRepository assignmentRepository;
    private final BedRepository bedRepository;

    public ResponseEntity<Message> saveNurse(User user) {
        user.setRole("nurse");
        user.setNeedAuthentication(true);
        User saved = userRepository.save(user);
        return new ResponseEntity<>(new Message("Enfermero creado", saved), HttpStatus.CREATED);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAllNurses() {
        List<User> nurses = userRepository.findAllByRole("nurse");
        return new ResponseEntity<>(new Message("Enfermeros encontrados", nurses), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAllStretchers() {
        List<User> stretchers = userRepository.findAllByRole("stretcher");
        return new ResponseEntity<>(new Message("Camillas encontradas", stretchers), HttpStatus.OK);
    }

    // ============== Asignación de Camas a Enfermeros ==============

    /**
     * Asignar una cama a un enfermero e iniciar turno automáticamente
     */
    public ResponseEntity<Message> assignBedToNurse(Long nurseId, Long bedId) {

        // Verificar que el enfermero existe
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El enfermero no existe"), HttpStatus.NOT_FOUND);
        }

        User nurse = nurseOptional.get();

        // Verificar que es un enfermero
        if (!"nurse".equals(nurse.getRole())) {
            return new ResponseEntity<>(
                    new Message("El usuario no es un enfermero"),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Verificar que la cama existe
        Optional<Bed> bedOptional = bedRepository.findById(bedId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        // Verificar si ya existe una asignación activa
        if (assignmentRepository.existsActiveAssignmentByNurseIdAndBedId(nurseId, bedId)) {
            return new ResponseEntity<>(
                    new Message("Ya existe una asignación activa entre este enfermero y esta cama"),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Crear la asignación
        NurseAssignment assignment = new NurseAssignment();
        assignment.setNurse(nurse);
        assignment.setBed(bed);
        assignment.setShiftOpen(true);
        assignment.setShiftStart(LocalDateTime.now());
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());

        NurseAssignment saved = assignmentRepository.save(assignment);

        return new ResponseEntity<>(
                new Message("Cama asignada correctamente y turno iniciado", saved),
                HttpStatus.CREATED
        );
    }

    /**
     * Obtener todas las asignaciones de un enfermero (activas e inactivas)
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAssignmentsByNurse(Long nurseId) {

        // Verificar que el enfermero existe
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El enfermero no existe"), HttpStatus.NOT_FOUND);
        }

        List<NurseAssignment> assignments = assignmentRepository.findAllByNurseId(nurseId);

        return new ResponseEntity<>(
                new Message("Asignaciones encontradas", assignments),
                HttpStatus.OK
        );
    }

    /**
     * Obtener solo las asignaciones activas de un enfermero
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> getActiveAssignmentsByNurse(Long nurseId) {

        // Verificar que el enfermero existe
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El enfermero no existe"), HttpStatus.NOT_FOUND);
        }

        List<NurseAssignment> assignments = assignmentRepository.findActiveAssignmentsByNurseId(nurseId);

        // Convertir a DTO con información del paciente
        List<ActiveAssignmentDTO> assignmentDTOs = assignments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new ResponseEntity<>(
                new Message("Asignaciones activas encontradas", assignmentDTOs),
                HttpStatus.OK
        );
    }

    /**
     * Obtener todas las asignaciones de una cama
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAssignmentsByBed(Long bedId) {

        // Verificar que la cama existe
        Optional<Bed> bedOptional = bedRepository.findById(bedId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        List<NurseAssignment> assignments = assignmentRepository.findAllByBedId(bedId);

        return new ResponseEntity<>(
                new Message("Asignaciones de la cama encontradas", assignments),
                HttpStatus.OK
        );
    }

    // ============== Gestión de Turnos ==============

    /**
     * Iniciar turno (abrir turno) para una asignación específica
     */
    public ResponseEntity<Message> startShift(Long assignmentId) {

        Optional<NurseAssignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (!assignmentOptional.isPresent()) {
            return new ResponseEntity<>(
                    new Message("La asignación no existe"),
                    HttpStatus.NOT_FOUND
            );
        }

        NurseAssignment assignment = assignmentOptional.get();

        // Verificar si el turno ya está abierto
        if (assignment.getShiftOpen()) {
            return new ResponseEntity<>(
                    new Message("El turno ya está abierto"),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Abrir el turno
        assignment.setShiftOpen(true);
        assignment.setShiftStart(LocalDateTime.now());
        assignment.setShiftEnd(null);
        assignment.setUpdatedAt(LocalDateTime.now());

        NurseAssignment updated = assignmentRepository.saveAndFlush(assignment);

        return new ResponseEntity<>(
                new Message("Turno iniciado correctamente", updated),
                HttpStatus.OK
        );
    }

    /**
     * Cerrar turno para una asignación específica
     */
    public ResponseEntity<Message> endShift(Long assignmentId) {

        Optional<NurseAssignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (!assignmentOptional.isPresent()) {
            return new ResponseEntity<>(
                    new Message("La asignación no existe"),
                    HttpStatus.NOT_FOUND
            );
        }

        NurseAssignment assignment = assignmentOptional.get();

        // Verificar si el turno está cerrado
        if (!assignment.getShiftOpen()) {
            return new ResponseEntity<>(
                    new Message("El turno ya está cerrado"),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Cerrar el turno
        assignment.setShiftOpen(false);
        assignment.setShiftEnd(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());

        NurseAssignment updated = assignmentRepository.saveAndFlush(assignment);

        return new ResponseEntity<>(
                new Message("Turno cerrado correctamente", updated),
                HttpStatus.OK
        );
    }

    /**
     * Cerrar todos los turnos activos de un enfermero
     */
    public ResponseEntity<Message> endAllShiftsForNurse(Long nurseId) {

        // Verificar que el enfermero existe
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(
                    new Message("El enfermero no existe"),
                    HttpStatus.NOT_FOUND
            );
        }

        List<NurseAssignment> activeAssignments = assignmentRepository.findActiveAssignmentsByNurseId(nurseId);

        if (activeAssignments.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("El enfermero no tiene turnos activos"),
                    HttpStatus.OK
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // Cerrar todos los turnos activos
        for (NurseAssignment assignment : activeAssignments) {
            assignment.setShiftOpen(false);
            assignment.setShiftEnd(now);
            assignment.setUpdatedAt(now);
        }

        assignmentRepository.saveAll(activeAssignments);

        return new ResponseEntity<>(
                new Message(activeAssignments.size() + " turnos cerrados correctamente", activeAssignments),
                HttpStatus.OK
        );
    }

    /**
     * Eliminar una asignación (solo si el turno está cerrado)
     */
    public ResponseEntity<Message> deleteAssignment(Long assignmentId) {

        Optional<NurseAssignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (!assignmentOptional.isPresent()) {
            return new ResponseEntity<>(
                    new Message("La asignación no existe"),
                    HttpStatus.NOT_FOUND
            );
        }

        NurseAssignment assignment = assignmentOptional.get();

        // Verificar si el turno está abierto
        if (assignment.getShiftOpen()) {
            return new ResponseEntity<>(
                    new Message("No se puede eliminar una asignación con turno abierto. Cierre el turno primero."),
                    HttpStatus.BAD_REQUEST
            );
        }

        assignmentRepository.delete(assignment);

        return new ResponseEntity<>(
                new Message("Asignación eliminada correctamente"),
                HttpStatus.OK
        );
    }

    /**
     * Obtener todas las asignaciones activas del sistema
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAllActiveAssignments() {
        List<NurseAssignment> activeAssignments = assignmentRepository.findAllActiveAssignments();

        return new ResponseEntity<>(
                new Message("Asignaciones activas encontradas", activeAssignments),
                HttpStatus.OK
        );
    }
    private ActiveAssignmentDTO convertToDTO(NurseAssignment assignment) {
        ActiveAssignmentDTO dto = new ActiveAssignmentDTO();

        // Información de la asignación
        dto.setAssignmentId(assignment.getId());
        dto.setShiftOpen(assignment.getShiftOpen());
        dto.setShiftStart(assignment.getShiftStart());
        dto.setShiftEnd(assignment.getShiftEnd());

        // Información del enfermero
        dto.setNurseId(assignment.getNurse().getId());

        // Información de la cama
        Bed bed = assignment.getBed();
        dto.setBedId(bed.getId());
        dto.setBedStatus(bed.getStatus().name());

        // Información del paciente (si existe)
        Patient patient = bed.getPaciente();
        if (patient != null) {
            dto.setPatientId(patient.getId());
            dto.setPatientName(patient.getNombre() + " " + patient.getApellidos());
            dto.setPatientBloodType(patient.getTipoSangre());
            dto.setPatientAilments(patient.getPadecimientos());
            dto.setPatientDescription(patient.getDescripcion());
            dto.setPatientAdmissionDate(patient.getFechaIngreso());
        }

        return dto;
    }
}