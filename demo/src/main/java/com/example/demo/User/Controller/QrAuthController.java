package com.example.demo.User.Controller;

import com.example.demo.User.Service.QrAuthService;
import com.example.demo.utils.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@AllArgsConstructor
public class QrAuthController {

    private final QrAuthService authService;

    /**
     * Login mediante QR
     * POST /api/auth/login-qr
     * Body: { "bedId": 15 }
     */
    @PostMapping("/login-qr")
    public ResponseEntity<Message> loginQr(@RequestBody QrLoginRequest request) {
        return authService.loginViaQr(request.getBedId());
    }

    /**
     * DTO para la petición de login QR
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class QrLoginRequest {
        private Long bedId;
    }
}