package com.example.demo.Attention;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.example.demo.utils.Message;

import lombok.AllArgsConstructor;
import lombok.Data;

@Service
@Data
@AllArgsConstructor
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
        return new ResponseEntity<>(new Message("Solicitudes encontradas", list), HttpStatus.OK);
    }

    public ResponseEntity<Message> findAll() {
        List<Bean> list = repository.findAll();
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No hay registros"), HttpStatus.OK);
        }
        return new ResponseEntity<>(new Message("Registros encontrados", list), HttpStatus.OK);
    }

    public ResponseEntity<Message> save(Dto dto) {
        Long stretcherId = dto.getStretcherId();

        // Check if there is already a PENDING request for this stretcher
        List<Bean> existing = repository.findAllByStretcherId(stretcherId);
        Bean pendingRequest = existing.stream()
                .filter(b -> "Pendiente".equals(b.getStatus()))
                .findFirst()
                .orElse(null);

        Bean resultBean;

        if (pendingRequest != null) {
            // Already pending: Just update timestamp but don't create new record
            pendingRequest.setDateTime(dto.getDateTime());
            resultBean = repository.save(pendingRequest);
            // We proceed to trigger notification again
        } else {
            // New request
            Bean bean = new Bean();
            bean.setDateTime(dto.getDateTime());
            bean.setStatus(dto.getStatus());
            bean.setStretcherId(stretcherId);
            resultBean = repository.save(bean);
        }

        // TRIGGER NOTIFICATION (Always trigger if requested again)
        try {
            com.example.demo.Bed.Entity.Bed bed = bedRepository.findById(stretcherId).orElse(null);

            if (bed != null && bed.getNurseAssignments() != null) {
                // Find active assignment
                for (com.example.demo.Nurse.NurseAssignment assignment : bed.getNurseAssignments()) {
                    if (Boolean.TRUE.equals(assignment.getShiftOpen())) {
                        com.example.demo.User.Entity.User nurse = assignment.getNurse();
                        if (nurse != null) {
                            notificationService.sendToUser(nurse, "Nueva Solicitud",
                                    "El paciente de la cama " + stretcherId + " solicita ayuda.");
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Don't fail the request if notification fails
        }

        return new ResponseEntity<>(new Message("Datos guardados", resultBean), HttpStatus.OK);
    }

    // Buscamos por idStretcher
    public ResponseEntity<Message> findAllByStretcherId(Long stretcherId) {
        List<Bean> list = repository.findAllByStretcherId(stretcherId);
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No se encontraron datos"), HttpStatus.NOT_FOUND);
        }
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
