package com.example.demo.Nurse;

import com.example.demo.User.Entity.User;
import com.example.demo.User.Service.Repository;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Data
@AllArgsConstructor
public class NurseService {

    private final Repository userRepository;
    private final NurseAssignmentRepository assignmentRepository;

    // Nurse CRUD
    public ResponseEntity<Message> saveNurse(User user) {
        user.setRole("nurse");
        user.setNeedAuthentication(true);
        User saved = userRepository.save(user);
        return new ResponseEntity<>(new Message("Enfermero creado", saved), HttpStatus.OK);
    }

    public ResponseEntity<Message> getAllNurses() {
        List<User> nurses = userRepository.findAllByRole("nurse");
        return new ResponseEntity<>(new Message("Enfermeros encontrados", nurses), HttpStatus.OK);
    }

    public ResponseEntity<Message> getAllStretchers() {
        List<User> stretchers = userRepository.findAllByRole("stretcher");
        return new ResponseEntity<>(new Message("Camillas encontradas", stretchers), HttpStatus.OK);
    }

    // Assignment Logic
    public ResponseEntity<Message> assignStretcher(Long nurseId, Long stretcherId) {
        if (assignmentRepository.existsByNurseIdAndStretcherId(nurseId, stretcherId)) {
            return new ResponseEntity<>(new Message("Ya está asignado"), HttpStatus.BAD_REQUEST);
        }
        NurseAssignment assignment = new NurseAssignment(null, nurseId, stretcherId);
        NurseAssignment saved = assignmentRepository.save(assignment);
        return new ResponseEntity<>(new Message("Asignación exitosa", saved), HttpStatus.OK);
    }

    public ResponseEntity<Message> getAssignments(Long nurseId) {
        List<NurseAssignment> assignments = assignmentRepository.findAllByNurseId(nurseId);
        return new ResponseEntity<>(new Message("Asignaciones encontradas", assignments), HttpStatus.OK);
    }
}
