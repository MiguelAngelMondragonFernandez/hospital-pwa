package com.example.demo.Notification.Controller;

import com.example.demo.Notification.Service.NotificationService;
import com.example.demo.User.Entity.User;
import com.example.demo.User.Service.Repository;
import com.example.demo.utils.Message;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;
    private final Repository userRepository;

    public NotificationController(NotificationService notificationService, Repository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/vapid-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("publicKey", notificationService.getPublicKey()));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Message> subscribe(@RequestBody SubscriptionDto dto) {
        User user = userRepository.findById(dto.getUserId()).orElse(null);

        if (user == null) {
            return new ResponseEntity<>(new Message("Usuario no encontrado"), HttpStatus.NOT_FOUND);
        }

        notificationService.subscribe(user, dto.getToken());

        return new ResponseEntity<>(new Message("Suscripción exitosa"), HttpStatus.OK);
    }
}

@Data
class SubscriptionDto {
    private String token;
    private Long userId; // Para identificar quien se suscribe
}
