package com.example.demo.Bed.Service;

import com.example.demo.Bed.Entity.Bed;
import com.example.demo.Bed.Entity.BedRepository;
import com.example.demo.Patient.Entity.Patient;
import com.example.demo.Patient.Entity.PatientRepository;
import com.example.demo.Qr.Service.QrService;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
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
@Service
@Transactional
public class BedService {

    private final BedRepository repo;
    private final PatientRepository patientRepository;
    private final QrService qrService;

    @Transactional(readOnly = true)
    public ResponseEntity<Message> findAll() {
        List<Bed> beds = repo.findAll();
        return new ResponseEntity<>(new Message("Lista de camas.", beds), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Message> findById(Long id) {
        Optional<Bed> bedOptional = repo.findById(id);

        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        // Cargar el paciente asociado si existe
        if (bed.getPaciente() != null) {
            // Forzar la carga del paciente para evitar lazy loading
            bed.getPaciente().getNombre();
        }

        return new ResponseEntity<>(new Message("Cama encontrada", bed), HttpStatus.OK);
    }

    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> save(Bed bed) {

        if (bed.getStatus() == null) {
            bed.setStatus(Bed.BedStatus.libre);
        }

        bed.setCreatedAt(LocalDateTime.now());
        bed.setUpdatedAt(LocalDateTime.now());

        Bed saved = repo.save(bed);

        if (saved == null) {
            return new ResponseEntity<>(new Message("La cama no se pudo crear"), HttpStatus.BAD_REQUEST);
        }

        return new ResponseEntity<>(new Message("Se guardó la cama correctamente", saved), HttpStatus.CREATED);
    }

    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> update(Bed dto) {

        Optional<Bed> bedOptional = repo.findById(dto.getId());

        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        bed.setStatus(dto.getStatus());
        bed.setAssignDate(dto.getAssignDate());
        bed.setReleaseDate(dto.getReleaseDate());
        bed.setUpdatedAt(LocalDateTime.now());

        bed = repo.saveAndFlush(bed);

        if (bed == null) {
            return new ResponseEntity<>(new Message("La cama no se pudo actualizar"), HttpStatus.BAD_REQUEST);
        }

        return new ResponseEntity<>(new Message("Se actualizó correctamente", bed), HttpStatus.OK);
    }

    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> delete(Long id) {

        Optional<Bed> bedOptional = repo.findById(id);

        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        // Verificar si tiene paciente asignado
        if (bed.getPaciente() != null) {
            return new ResponseEntity<>(
                    new Message("No se puede eliminar la cama porque tiene un paciente asignado"),
                    HttpStatus.BAD_REQUEST
            );
        }

        try {
            repo.delete(bed);
            return new ResponseEntity<>(new Message("Eliminada correctamente"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new Message("No se pude eliminar la cama"),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> updateStatus(Long id, Bed.BedStatus newStatus) {

        Optional<Bed> bedOptional = repo.findById(id);

        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();
        bed.setStatus(newStatus);
        bed.setUpdatedAt(LocalDateTime.now());

        repo.saveAndFlush(bed);

        return new ResponseEntity<>(
                new Message("El status de la cama se actualizó correctamente", bed),
                HttpStatus.OK
        );
    }

    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> changeStatus(Long bedId, String newStatus) {
        Optional<Bed> bedOptional = repo.findById(bedId);

        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        // Validar que el estatus sea válido
        try {
            Bed.BedStatus status = Bed.BedStatus.valueOf(newStatus);

            // VALIDACIÓN: No permitir cambiar a "libre" si tiene paciente asignado
            if (status == Bed.BedStatus.libre && bed.getPaciente() != null) {
                return new ResponseEntity<>(
                        new Message("No se puede cambiar el estado a 'libre' porque la cama tiene un paciente asignado. " +
                                "Primero debe liberar al paciente usando el botón correspondiente."),
                        HttpStatus.BAD_REQUEST
                );
            }

            // VALIDACIÓN: Si la cama está ocupada, solo se puede cambiar a limpieza o mantenimiento
            // (no a libre directamente)
            if (bed.getStatus() == Bed.BedStatus.ocupada && status == Bed.BedStatus.libre && bed.getPaciente() != null) {
                return new ResponseEntity<>(
                        new Message("No se puede cambiar directamente de 'ocupada' a 'libre' con un paciente asignado. " +
                                "Use la función de liberar cama primero."),
                        HttpStatus.BAD_REQUEST
                );
            }

            bed.setStatus(status);
            bed.setUpdatedAt(LocalDateTime.now());

            bed = repo.saveAndFlush(bed);

            return new ResponseEntity<>(new Message("Estatus actualizado correctamente", bed), HttpStatus.OK);

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new Message("Estatus inválido. Los valores permitidos son: libre, ocupada, limpieza, mantenimiento"),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Asignar un paciente a una cama
     * Solo se puede asignar si la cama está libre
     */
    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> asignarPacienteACama(Long camaId, Long pacienteId) {

        // Verificar que la cama existe
        Optional<Bed> bedOptional = repo.findById(camaId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        // Verificar que el paciente existe
        Optional<Patient> patientOptional = patientRepository.findById(pacienteId);
        if (!patientOptional.isPresent()) {
            return new ResponseEntity<>(new Message("El paciente no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();
        Patient patient = patientOptional.get();

        // Verificar que la cama está libre
        if (bed.getStatus() != Bed.BedStatus.libre) {
            return new ResponseEntity<>(
                    new Message("La cama no está disponible. Estado actual: " + bed.getStatus()),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Verificar que la cama no tiene paciente asignado
        if (bed.getPaciente() != null) {
            return new ResponseEntity<>(
                    new Message("La cama ya tiene un paciente asignado"),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Verificar que el paciente no tenga otra cama asignada
        if (patient.getCama() != null) {
            return new ResponseEntity<>(
                    new Message("El paciente ya tiene una cama asignada (ID: " + patient.getCama().getId() + ")"),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Asignar el paciente a la cama
        patient.setCama(bed);
        patient.setUpdatedAt(LocalDateTime.now());

        // Actualizar estado de la cama
        bed.setStatus(Bed.BedStatus.ocupada);
        bed.setAssignDate(LocalDateTime.now());
        bed.setReleaseDate(null);
        bed.setUpdatedAt(LocalDateTime.now());

        // Guardar cambios
        patientRepository.saveAndFlush(patient);
        repo.saveAndFlush(bed);

        return new ResponseEntity<>(
                new Message("Paciente asignado correctamente a la cama", bed),
                HttpStatus.OK
        );
    }

    /**
     * Liberar una cama (remover paciente asignado)
     * Cambia el estado de la cama a libre y desvincula el paciente
     */
    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> liberarCama(Long camaId) {

        // Verificar que la cama existe
        Optional<Bed> bedOptional = repo.findById(camaId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        // Verificar si hay un paciente asignado
        if (bed.getPaciente() == null) {
            return new ResponseEntity<>(
                    new Message("La cama no tiene ningún paciente asignado"),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Obtener el paciente antes de desvincularlo
        Patient patient = bed.getPaciente();

        // Desvincular el paciente de la cama
        patient.setCama(null);
        patient.setUpdatedAt(LocalDateTime.now());

        // Actualizar estado de la cama
        bed.setStatus(Bed.BedStatus.libre);
        bed.setReleaseDate(LocalDateTime.now());
        bed.setUpdatedAt(LocalDateTime.now());

        // Guardar cambios
        patientRepository.saveAndFlush(patient);
        repo.saveAndFlush(bed);

        return new ResponseEntity<>(
                new Message("Cama liberada correctamente", bed),
                HttpStatus.OK
        );
    }

    /**
     * Generar código QR para una cama y guardar la URL
     * Usa QrService para crear la imagen física
     */
    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> generarQrCama(Long camaId) {

        // Verificar que la cama existe
        Optional<Bed> bedOptional = repo.findById(camaId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        try {
            // Generar el QR físicamente y obtener la URL
            String qrUrl = qrService.generateQrForBed(camaId);

            // Guardar la URL en la base de datos
            bed.setQrUrl(qrUrl);
            bed.setUpdatedAt(LocalDateTime.now());
            repo.saveAndFlush(bed);

            return new ResponseEntity<>(
                    new Message("Código QR generado correctamente", bed),
                    HttpStatus.OK
            );

        } catch (Exception e) {
            return new ResponseEntity<>(
                    new Message("Error al generar el código QR: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Obtener información del paciente asignado a una cama
     * Este método es llamado cuando se escanea el QR
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> getPatientByBedId(Long bedId) {

        // Verificar que la cama existe
        Optional<Bed> bedOptional = repo.findById(bedId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(new Message("La cama no existe"), HttpStatus.NOT_FOUND);
        }

        Bed bed = bedOptional.get();

        // Verificar si hay paciente asignado
        if (bed.getPaciente() == null) {
            return new ResponseEntity<>(
                    new Message("Esta cama no tiene paciente asignado"),
                    HttpStatus.NOT_FOUND
            );
        }

        Patient patient = bed.getPaciente();

        // Crear DTO con la información necesaria
        PatientBedInfoDTO info = new PatientBedInfoDTO();
        info.setBedId(bed.getId());
        info.setBedStatus(bed.getStatus().name());
        info.setPatientName(patient.getNombre() + " " + patient.getApellidos());
        info.setBloodType(patient.getTipoSangre());
        info.setAilments(patient.getPadecimientos());
        info.setDescription(patient.getDescripcion());
        info.setAdmissionDate(patient.getFechaIngreso());

        return new ResponseEntity<>(
                new Message("Información del paciente", info),
                HttpStatus.OK
        );
    }

    /**
     * DTO para retornar información del paciente desde el escaneo QR
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PatientBedInfoDTO {
        private Long bedId;
        private String bedStatus;
        private String patientName;
        private String bloodType;
        private String ailments;
        private String description;
        private LocalDateTime admissionDate;
    }
}