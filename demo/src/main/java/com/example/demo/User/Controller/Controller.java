package com.example.demo.User.Controller;

import com.example.demo.User.Entity.UserDto;
import com.example.demo.User.Service.Service;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@AllArgsConstructor
public class Controller {

    private final Service service;

    @PostMapping("/need-authentication")
    public ResponseEntity<Message> needAuthentication(@RequestBody UserDto dto) {
        return service.checkAuth(dto);
    }

    @PostMapping("/login")
    public ResponseEntity<Message> login(@RequestBody UserDto dto) {
        return service.login(dto);
    }
}