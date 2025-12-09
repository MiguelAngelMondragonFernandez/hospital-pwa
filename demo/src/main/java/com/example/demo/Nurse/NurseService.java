package com.example.demo.Nurse;

import com.example.demo.Bed.Entity.Bed;
import com.example.demo.Bed.Entity.BedRepository;
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

    public ResponseEntity<Message> assignBedToNurse(Long nurseId, Long bedId) {
        // Verificar que el enfermero existe
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El enfermero no existe"), HttpStatus.NOT_FOUND);
        }

        User nurse = nurseOptional.get();

        if (!"nurse".equals(nurse.getRole())) {
            return new ResponseEntity<>(new Message("El usuario no es un enfermero"), HttpStatus.BAD_REQUEST);
        }

        // Verificar que la cama existe
        Optional<Bed> bedOptional = bedRepository.findById(bedId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        // Verificar si ya existe una asignación activa
        if (assignmentRepository.existsActiveAssignmentByNurseIdAndBedId(nurseId, bedId)) {
            return new ResponseEntity<>(new Message("Ya existe una asignación activa entre este enfermero y esta cama"), HttpStatus.BAD_REQUEST);
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

        return new ResponseEntity<>(new Message("Cama asignada correctamente y turno iniciado", saved), HttpStatus.CREATED);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAssignmentsByNurse(Long nurseId) {
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El enfermero no existe"), HttpStatus.NOT_FOUND);
        }
        List<NurseAssignment> assignments = assignmentRepository.findAllByNurseId(nurseId);
        return new ResponseEntity<>(new Message("Asignaciones encontradas", assignments), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> getActiveAssignmentsByNurse(Long nurseId) {
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El enfermero no existe"), HttpStatus.NOT_FOUND);
        }
        // Nota: Asegúrate de que tu Repository use el método con LEFT JOIN FETCH que hicimos antes
        List<NurseAssignment> assignments = assignmentRepository.findActiveAssignmentsByNurseId(nurseId);
        return new ResponseEntity<>(new Message("Asignaciones activas encontradas", assignments), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAssignmentsByBed(Long bedId) {
        Optional<Bed> bedOptional = bedRepository.findById(bedId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }
        List<NurseAssignment> assignments = assignmentRepository.findAllByBedId(bedId);
        return new ResponseEntity<>(new Message("Asignaciones de la cama encontradas", assignments), HttpStatus.OK);
    }

    // ============== Gestión de Turnos ==============

    public ResponseEntity<Message> startShift(Long assignmentId) {
        Optional<NurseAssignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (!assignmentOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La asignación no existe"), HttpStatus.NOT_FOUND);
        }
        NurseAssignment assignment = assignmentOptional.get();
        if (assignment.getShiftOpen()) {
            return new ResponseEntity<>(new Message("El turno ya está abierto"), HttpStatus.BAD_REQUEST);
        }
        assignment.setShiftOpen(true);
        assignment.setShiftStart(LocalDateTime.now());
        assignment.setShiftEnd(null);
        assignment.setUpdatedAt(LocalDateTime.now());
        NurseAssignment updated = assignmentRepository.saveAndFlush(assignment);
        return new ResponseEntity<>(new Message("Turno iniciado correctamente", updated), HttpStatus.OK);
    }

    public ResponseEntity<Message> endShift(Long assignmentId) {
        Optional<NurseAssignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (!assignmentOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La asignación no existe"), HttpStatus.NOT_FOUND);
        }
        NurseAssignment assignment = assignmentOptional.get();
        if (!assignment.getShiftOpen()) {
            return new ResponseEntity<>(new Message("El turno ya está cerrado"), HttpStatus.BAD_REQUEST);
        }
        // Aquí podríamos borrar si quisieras borrar asignaciones individuales,
        // pero por ahora lo dejamos como cerrar.
        assignment.setShiftOpen(false);
        assignment.setShiftEnd(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());
        NurseAssignment updated = assignmentRepository.saveAndFlush(assignment);
        return new ResponseEntity<>(new Message("Turno cerrado correctamente", updated), HttpStatus.OK);
    }

    /**
     * [MODIFICADO] Cerrar todos los turnos activos de un enfermero
     * AHORA BORRA LAS ASIGNACIONES DE LA BD PARA EVITAR NOTIFICACIONES
     */
    public ResponseEntity<Message> endAllShiftsForNurse(Long nurseId) {

        // Verificar que el enfermero existe
        Optional<User> nurseOptional = userRepository.findById(nurseId);
        if (!nurseOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El enfermero no existe"), HttpStatus.NOT_FOUND);
        }

        List<NurseAssignment> activeAssignments = assignmentRepository.findActiveAssignmentsByNurseId(nurseId);

        if (activeAssignments.isEmpty()) {
            return new ResponseEntity<>(new Message("El enfermero no tiene turnos activos"), HttpStatus.OK);
        }

        // --- CAMBIO PRINCIPAL ---
        // En lugar de solo cambiar el estado a false, BORRAMOS los registros.
        // Esto elimina físicamente la relación entre enfermero y cama.
        assignmentRepository.deleteAll(activeAssignments);

        return new ResponseEntity<>(
                new Message("Turno finalizado y camas desasignadas correctamente (Registros eliminados)."),
                HttpStatus.OK
        );
    }

    public ResponseEntity<Message> deleteAssignment(Long assignmentId) {
        Optional<NurseAssignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (!assignmentOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La asignación no existe"), HttpStatus.NOT_FOUND);
        }
        NurseAssignment assignment = assignmentOptional.get();
        // Permitimos borrar incluso si está abierto, ya que es una eliminación explicita
        assignmentRepository.delete(assignment);
        return new ResponseEntity<>(new Message("Asignación eliminada correctamente"), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> getAllActiveAssignments() {
        List<NurseAssignment> activeAssignments = assignmentRepository.findAllActiveAssignments();
        return new ResponseEntity<>(new Message("Asignaciones activas encontradas", activeAssignments), HttpStatus.OK);
    }
}