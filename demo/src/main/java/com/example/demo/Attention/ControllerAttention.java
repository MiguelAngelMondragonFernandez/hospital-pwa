package com.example.demo.Attention;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.utils.Message;

@RestController
@RequestMapping("/api/attention")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@AllArgsConstructor
@Data
public class ControllerAttention {

    private final SService service;

    @GetMapping("/findAllUnattended")
    public ResponseEntity<Message> findAllUnattended() {
        return service.findAllUnattended();
    }

    @GetMapping("/findAll")
    public ResponseEntity<Message> findAll() {
        return service.findAll();
    }

    @PostMapping("/save")
    public ResponseEntity<Message> save(@RequestBody Dto dto) {
        return service.save(dto);
    }

    @GetMapping("/findAllByStretcherId/{stretcherId}")
    public ResponseEntity<Message> findAllByStretcherId(@PathVariable Long stretcherId) {
        return service.findAllByStretcherId(stretcherId);
    }

    @GetMapping("/delete/{id}")
    public ResponseEntity<Message> delete(@PathVariable Long id) {
        return service.delete(id);
    }

    @PostMapping("/update/{id}")
    public ResponseEntity<Message> update(@PathVariable Long id, @RequestBody Dto dto) {
        return service.update(id, dto);
    }

    @PostMapping("/markAsAttended/{id}")
    public ResponseEntity<Message> markAsAttended(@PathVariable Long id) {
        return service.markAsAttended(id);
    }
}
