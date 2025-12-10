package com.example.demo.Patient.Service;

import com.example.demo.Bed.Entity.Bed;
import com.example.demo.Bed.Entity.BedRepository;
import com.example.demo.Patient.Entity.Patient;
import com.example.demo.Patient.Entity.PatientRepository;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Data
@AllArgsConstructor
@Transactional
@Service
public class PatientService {

    private final PatientRepository repo;
    private final BedRepository bedRepository;

    @Transactional(readOnly = true)
    public ResponseEntity<Message> findAll() {
        List<Patient> patients = repo.findAll();
        return new ResponseEntity<>(new Message("Listado de pacientes.", patients), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> findById(Long id) {
        Optional<Patient> patientOptional = repo.findById(id);
        if (!patientOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El paciente no existe"), HttpStatus.NOT_FOUND);
        }

        Patient patient = patientOptional.get();

        // Forzar la carga de la cama si existe
        if (patient.getCama() != null) {
            patient.getCama().getId();
        }

        return new ResponseEntity<>(new Message("Paciente encontrado", patient), HttpStatus.OK);
    }

    @Transactional(rollbackFor = { SQLException.class })
    public ResponseEntity<Message> save(Patient patient) {
        // Validaciones
        if (patient.getNombre() == null || patient.getNombre().isEmpty()) {
            return new ResponseEntity<>(new Message("El nombre es obligatorio"), HttpStatus.BAD_REQUEST);
        }

        if (patient.getApellidos() == null || patient.getApellidos().isEmpty()) {
            return new ResponseEntity<>(new Message("Los apellidos son obligatorios"), HttpStatus.BAD_REQUEST);
        }

        if (patient.getNombre().length() > 150) {
            return new ResponseEntity<>(new Message("El nombre excede los 150 caracteres"), HttpStatus.BAD_REQUEST);
        }

        if (patient.getApellidos().length() > 150) {
            return new ResponseEntity<>(new Message("Los apellidos exceden los 150 caracteres"),
                    HttpStatus.BAD_REQUEST);
        }

        if (patient.getTipoSangre() != null && patient.getTipoSangre().length() > 10) {
            return new ResponseEntity<>(new Message("El tipo de sangre excede los 10 caracteres"),
                    HttpStatus.BAD_REQUEST);
        }

        if (patient.getDescripcion() != null && patient.getDescripcion().length() > 65535) {
            return new ResponseEntity<>(new Message("La descripción es demasiado larga"), HttpStatus.BAD_REQUEST);
        }

        if (patient.getPadecimientos() != null && patient.getPadecimientos().length() > 65535) {
            return new ResponseEntity<>(new Message("Los padecimientos son demasiado largos"), HttpStatus.BAD_REQUEST);
        }

        // Establecer valores por defecto
        if (patient.getEstatus() == null) {
            patient.setEstatus(Patient.EstatusPaciente.activo);
        }

        // Generar username si es nulo
        if (patient.getUsername() == null || patient.getUsername().isEmpty()) {
            String baseUser = (patient.getNombre() + "." + patient.getApellidos()).toLowerCase().replaceAll("\\s+", "");
            // Agregar un sufijo aleatorio para garantizar unicidad
            String suffix = java.util.UUID.randomUUID().toString().substring(0, 8);
            patient.setUsername(baseUser + "." + suffix);
        }

        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedAt(LocalDateTime.now());
        patient.setFechaIngreso(LocalDateTime.now());

        Patient saved = repo.save(patient);

        if (saved == null) {
            return new ResponseEntity<>(new Message("El paciente no se registró"), HttpStatus.BAD_REQUEST);
        }

        return new ResponseEntity<>(new Message("Paciente registrado correctamente", saved), HttpStatus.CREATED);
    }

    @Transactional(rollbackFor = { SQLException.class })
    public ResponseEntity<Message> update(Patient dto) {

        Optional<Patient> patientOptional = repo.findById(dto.getId());
        if (!patientOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El paciente no existe"), HttpStatus.NOT_FOUND);
        }

        // Validaciones
        if (dto.getNombre() == null || dto.getNombre().isEmpty()) {
            return new ResponseEntity<>(new Message("El nombre es obligatorio"), HttpStatus.BAD_REQUEST);
        }

        if (dto.getNombre().length() > 150) {
            return new ResponseEntity<>(new Message("El nombre excede los 150 caracteres"), HttpStatus.BAD_REQUEST);
        }

        if (dto.getApellidos() != null && dto.getApellidos().length() > 150) {
            return new ResponseEntity<>(new Message("Los apellidos exceden los 150 caracteres"),
                    HttpStatus.BAD_REQUEST);
        }

        if (dto.getTipoSangre() != null && dto.getTipoSangre().length() > 10) {
            return new ResponseEntity<>(new Message("El tipo de sangre excede los 10 caracteres"),
                    HttpStatus.BAD_REQUEST);
        }

        Patient patient = patientOptional.get();

        // Actualizar campos básicos
        patient.setNombre(dto.getNombre());
        patient.setApellidos(dto.getApellidos());
        patient.setTipoSangre(dto.getTipoSangre());
        patient.setPadecimientos(dto.getPadecimientos());
        patient.setDescripcion(dto.getDescripcion());
        patient.setEstatus(dto.getEstatus());
        patient.setFechaIngreso(dto.getFechaIngreso());
        patient.setFechaSalida(dto.getFechaSalida());
        patient.setUpdatedAt(LocalDateTime.now());

        // NO actualizar la cama aquí, usar el endpoint específico para eso

        patient = repo.saveAndFlush(patient);

        if (patient == null) {
            return new ResponseEntity<>(new Message("El paciente no se actualizó"), HttpStatus.BAD_REQUEST);
        }

        return new ResponseEntity<>(new Message("El paciente se actualizó correctamente", patient), HttpStatus.OK);
    }

    @Transactional(rollbackFor = { SQLException.class })
    public ResponseEntity<Message> delete(Long id) {
        Optional<Patient> patientOptional = repo.findById(id);

        if (!patientOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El paciente no existe"), HttpStatus.NOT_FOUND);
        }

        Patient patient = patientOptional.get();

        // Si tiene cama asignada, primero liberar la cama
        if (patient.getCama() != null) {
            Bed bed = patient.getCama();
            bed.setStatus(Bed.BedStatus.libre);
            bed.setReleaseDate(LocalDateTime.now());
            bed.setUpdatedAt(LocalDateTime.now());
            bedRepository.saveAndFlush(bed);

            patient.setCama(null);
        }

        try {
            repo.delete(patient);
            return new ResponseEntity<>(new Message("Paciente eliminado correctamente"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new Message("No se pudo eliminar el paciente: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Asignar una cama a un paciente
     * Valida que la cama esté libre antes de asignar
     */
    @Transactional(rollbackFor = { SQLException.class })
    public ResponseEntity<Message> assignBed(Long patientId, Long camaId) {

        // Verificar que el paciente existe
        Optional<Patient> patientOptional = repo.findById(patientId);
        if (!patientOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El paciente no existe"), HttpStatus.NOT_FOUND);
        }

        // Verificar que la cama existe
        Optional<Bed> bedOptional = bedRepository.findById(camaId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Patient patient = patientOptional.get();
        Bed bed = bedOptional.get();

        // Verificar si el paciente ya tiene cama
        if (patient.getCama() != null) {
            return new ResponseEntity<>(
                    new Message("El paciente ya está asignado a la cama ID: " + patient.getCama().getId()),
                    HttpStatus.BAD_REQUEST);
        }

        // Verificar que la cama esté libre
        if (bed.getStatus() != Bed.BedStatus.libre) {
            return new ResponseEntity<>(
                    new Message("La cama no está disponible. Estado actual: " + bed.getStatus()),
                    HttpStatus.BAD_REQUEST);
        }

        // Verificar que la cama no tenga otro paciente
        if (bed.getPaciente() != null) {
            return new ResponseEntity<>(
                    new Message("La cama ya tiene un paciente asignado"),
                    HttpStatus.BAD_REQUEST);
        }

        // Asignar la cama al paciente
        patient.setCama(bed);
        patient.setUpdatedAt(LocalDateTime.now());

        // Actualizar el estado de la cama
        bed.setStatus(Bed.BedStatus.ocupada);
        bed.setAssignDate(LocalDateTime.now());
        bed.setReleaseDate(null);
        bed.setUpdatedAt(LocalDateTime.now());

        // Guardar cambios
        repo.saveAndFlush(patient);
        bedRepository.saveAndFlush(bed);

        return new ResponseEntity<>(
                new Message("Cama asignada correctamente", patient),
                HttpStatus.OK);
    }

    /**
     * Desasignar la cama de un paciente
     * Libera la cama y actualiza su estado
     */
    @Transactional(rollbackFor = { SQLException.class })
    public ResponseEntity<Message> unassignBed(Long patientId) {

        Optional<Patient> patientOptional = repo.findById(patientId);
        if (!patientOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El paciente no existe"), HttpStatus.NOT_FOUND);
        }

        Patient patient = patientOptional.get();

        // Verificar si tiene cama asignada
        if (patient.getCama() == null) {
            return new ResponseEntity<>(
                    new Message("El paciente no tiene una cama asignada"),
                    HttpStatus.BAD_REQUEST);
        }

        // Obtener la cama antes de desvincular
        Bed bed = patient.getCama();

        // Desvincular la cama del paciente
        patient.setCama(null);
        patient.setUpdatedAt(LocalDateTime.now());

        // Liberar la cama
        bed.setStatus(Bed.BedStatus.libre);
        bed.setReleaseDate(LocalDateTime.now());
        bed.setUpdatedAt(LocalDateTime.now());

        // Guardar cambios
        repo.saveAndFlush(patient);
        bedRepository.saveAndFlush(bed);

        return new ResponseEntity<>(
                new Message("Cama desvinculada correctamente", patient),
                HttpStatus.OK);
    }

    /**
     * Cambiar el estado de un paciente
     * Estados válidos: activo, inactivo, alta
     */
    @Transactional(rollbackFor = { SQLException.class })
    public ResponseEntity<Message> changeStatus(Long patientId, String newStatus) {

        Optional<Patient> patientOptional = repo.findById(patientId);
        if (!patientOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El paciente no existe"), HttpStatus.NOT_FOUND);
        }

        Patient patient = patientOptional.get();

        try {
            Patient.EstatusPaciente status = Patient.EstatusPaciente.valueOf(newStatus);
            patient.setEstatus(status);
            patient.setUpdatedAt(LocalDateTime.now());

            // Si el paciente es dado de alta, registrar fecha de salida y liberar cama
            if (status == Patient.EstatusPaciente.alta) {
                patient.setFechaSalida(LocalDateTime.now());

                // Liberar la cama si tiene una asignada
                if (patient.getCama() != null) {
                    Bed bed = patient.getCama();
                    bed.setStatus(Bed.BedStatus.libre);
                    bed.setReleaseDate(LocalDateTime.now());
                    bed.setUpdatedAt(LocalDateTime.now());
                    bedRepository.saveAndFlush(bed);

                    patient.setCama(null);
                }
            }

            patient = repo.saveAndFlush(patient);

            return new ResponseEntity<>(
                    new Message("Estatus del paciente actualizado correctamente", patient),
                    HttpStatus.OK);

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Message("Estatus inválido. Los valores permitidos son: activo, inactivo, alta"),
                    HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Obtener todos los pacientes con cama asignada
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> findPatientsWithBed() {
        List<Patient> patients = repo.findAll().stream()
                .filter(p -> p.getCama() != null)
                .toList();

        return new ResponseEntity<>(
                new Message("Pacientes con cama asignada", patients),
                HttpStatus.OK);
    }

    /**
     * Obtener todos los pacientes sin cama asignada
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> findPatientsWithoutBed() {
        List<Patient> patients = repo.findAll().stream()
                .filter(p -> p.getCama() == null)
                .toList();

        return new ResponseEntity<>(
                new Message("Pacientes sin cama asignada", patients),
                HttpStatus.OK);
    }
}