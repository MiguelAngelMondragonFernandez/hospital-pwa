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

    @PostMapping("/assign")
    public ResponseEntity<Message> assignStretcher(@RequestParam Long nurseId, @RequestParam Long stretcherId) {
        return service.assignStretcher(nurseId, stretcherId);
    }

    @GetMapping("/assignments/{nurseId}")
    public ResponseEntity<Message> getAssignments(@PathVariable Long nurseId) {
        return service.getAssignments(nurseId);
    }
}
