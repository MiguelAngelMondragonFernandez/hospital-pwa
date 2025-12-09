package com.example.demo.User.Service;

import com.example.demo.User.Entity.User;
import com.example.demo.User.Entity.UserDto;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Data
@AllArgsConstructor
@org.springframework.stereotype.Service
public class Service {
    private final Repository repository;

    public ResponseEntity<Message> checkAuth(UserDto dto) {
        Boolean result = repository.isAuthenticationNeeded(dto.getUsername());
        if (result == null) {
            return new ResponseEntity<>(
                    new Message("User not found", null, true),
                    HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(
                new Message("Success", result),
                HttpStatus.OK);
    }

    public ResponseEntity<Message> login(UserDto dto) {
        User user = repository.findByUsername(dto.getUsername());

        if (user == null) {
            return new ResponseEntity<>(
                    new Message("User not found", null, true),
                    HttpStatus.UNAUTHORIZED);
        }

        if (Boolean.TRUE.equals(user.getNeedAuthentication())) {
            if (user.getPassword() != null && user.getPassword().equals(dto.getPassword())) {
                return new ResponseEntity<>(
                        new Message("Login successful", user),
                        HttpStatus.OK);
            } else {
                return new ResponseEntity<>(
                        new Message("Invalid password", null, true),
                        HttpStatus.UNAUTHORIZED);
            }
        } else {
            // Authentication not needed
            return new ResponseEntity<>(
                    new Message("Login successful", user),
                    HttpStatus.OK);
        }
    }

    public ResponseEntity<Message> loginQr(UserDto dto) {
        User user = repository.findByUsername(dto.getUsername());

        if (user == null) {
            return new ResponseEntity<>(
                    new Message("User not found", null, true),
                    HttpStatus.UNAUTHORIZED);
        }

        // QR Login bypasses password check
        return new ResponseEntity<>(
                new Message("Login successful", user),
                HttpStatus.OK);
    }

}
