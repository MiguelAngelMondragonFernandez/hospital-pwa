package com.example.demo.Attention;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.example.demo.utils.Message;

import lombok.AllArgsConstructor;
import lombok.Data;

import lombok.extern.slf4j.Slf4j;

@Service
@Data
@AllArgsConstructor
@Slf4j
public class SService {

    private final IRespository repository;
    private final com.example.demo.Notification.Service.NotificationService notificationService;
    private final com.example.demo.Bed.Entity.BedRepository bedRepository; // We need this to find the bed and
    // assignments

    public ResponseEntity<Message> findAllUnattended() {
        List<Bean> list = repository.findAllByStatusNot("Atendida");
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No hay solicitudes pendientes"), HttpStatus.OK);
        }
        list.sort((a, b) -> b.getId().compareTo(a.getId()));
        return new ResponseEntity<>(new Message("Solicitudes encontradas", list), HttpStatus.OK);
    }

    public ResponseEntity<Message> findAll() {
        List<Bean> list = repository.findAll();
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No hay registros"), HttpStatus.OK);
        }
        list.sort((a, b) -> b.getId().compareTo(a.getId()));
        return new ResponseEntity<>(new Message("Registros encontrados", list), HttpStatus.OK);
    }

    @jakarta.transaction.Transactional
    public ResponseEntity<Message> save(Dto dto) {
        try {
            Long stretcherId = dto.getStretcherId();

            // Always create a new request to keep history, as requested
            Bean bean = new Bean();
            bean.setDateTime(dto.getDateTime());
            bean.setStatus(dto.getStatus());
            bean.setStretcherId(stretcherId);
            Bean resultBean = repository.save(bean);

            // TRIGGER NOTIFICATION (Always trigger if requested again)
            try {
                log.info("Intento de notificación para camilla: " + stretcherId);
                com.example.demo.Bed.Entity.Bed bed = bedRepository.findById(stretcherId).orElse(null);

                if (bed != null) {
                    if (bed.getNurseAssignments() != null) {
                        // Find active assignment
                        boolean notified = false;
                        for (com.example.demo.Nurse.NurseAssignment assignment : bed.getNurseAssignments()) {
                            if (Boolean.TRUE.equals(assignment.getShiftOpen())) {
                                com.example.demo.User.Entity.User nurse = assignment.getNurse();
                                if (nurse != null) {
                                    log.info("Enviando notificación a enfermero: " + nurse.getUsername());
                                    notificationService.sendToUser(nurse, "Nueva Solicitud",
                                            "El paciente de la cama " + stretcherId + " solicita ayuda.");
                                    notified = true;
                                }
                            }
                        }
                        if (!notified)
                            log.warn("No se encontró enfermero con turno abierto para esta cama.");
                    } else {
                        log.warn("La cama no tiene asignaciones de enfermeros (lista nula).");
                    }
                } else {
                    log.warn("Cama no encontrada con ID: " + stretcherId);
                }
            } catch (Exception e) {
                log.error("Error al enviar notificación: ", e);
                // Don't fail the request if notification fails
            }

            return new ResponseEntity<>(new Message("Datos guardados", resultBean), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fatal al guardar solicitud: ", e);
            return new ResponseEntity<>(new Message("Error interno: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Buscamos por idStretcher
    public ResponseEntity<Message> findAllByStretcherId(Long stretcherId) {
        List<Bean> list = repository.findAllByStretcherId(stretcherId);
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No se encontraron datos"), HttpStatus.NOT_FOUND);
        }
        list.sort((a, b) -> b.getId().compareTo(a.getId()));
        return new ResponseEntity<>(new Message("Datos encontrados", list), HttpStatus.OK);
    }

    public ResponseEntity<Message> delete(Long id) {
        Bean bean = repository.findById(id).orElse(null);
        if (bean == null) {
            return new ResponseEntity<>(new Message("No se encontro el dato"), HttpStatus.NOT_FOUND);
        }
        repository.delete(bean);
        return new ResponseEntity<>(new Message("Datos eliminados"), HttpStatus.OK);
    }

    public ResponseEntity<Message> update(Long id, Dto dto) {
        Bean bean = repository.findById(id).orElse(null);
        if (bean == null) {
            return new ResponseEntity<>(new Message("No se encontro el dato"), HttpStatus.NOT_FOUND);
        }
        bean.setDateTime(dto.getDateTime());
        bean.setStatus(dto.getStatus());
        bean.setStretcherId(dto.getStretcherId());
        Bean bean2 = repository.save(bean);
        return new ResponseEntity<>(new Message("Datos actualizados", bean2), HttpStatus.OK);
    }

    public ResponseEntity<Message> markAsAttended(Long id) {
        Bean bean = repository.findById(id).orElse(null);
        if (bean == null) {
            return new ResponseEntity<>(new Message("No se encontro la solicitud"), HttpStatus.NOT_FOUND);
        }
        bean.setStatus("Atendida");
        Bean bean2 = repository.save(bean);
        return new ResponseEntity<>(new Message("Solicitud marcada como atendida", bean2), HttpStatus.OK);
    }
}