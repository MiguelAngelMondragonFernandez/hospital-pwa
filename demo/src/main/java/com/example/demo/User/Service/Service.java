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

    /**
     * Verifica si un usuario requiere autenticación
     */
    public ResponseEntity<Message> checkAuth(UserDto dto) {
        Boolean result = repository.isAuthenticationNeeded(dto.getUsername());
        if (result == null) {
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, true),
                    HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(
                new Message("Consulta exitosa", result),
                HttpStatus.OK);
    }

    /**
     * Login tradicional con usuario y contraseña
     */
    public ResponseEntity<Message> login(UserDto dto) {
        User user = repository.findByUsername(dto.getUsername());

        if (user == null) {
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, true),
                    HttpStatus.UNAUTHORIZED);
        }

        // Si el usuario requiere autenticación, validar contraseña
        if (Boolean.TRUE.equals(user.getNeedAuthentication())) {
            if (dto.getPassword() == null || dto.getPassword().isEmpty()) {
                return new ResponseEntity<>(
                        new Message("Se requiere contraseña", null, true),
                        HttpStatus.BAD_REQUEST);
            }

            if (!user.getPassword().equals(dto.getPassword())) {
                return new ResponseEntity<>(
                        new Message("Contraseña incorrecta", null, true),
                        HttpStatus.UNAUTHORIZED);
            }
        }

        // Login exitoso
        return new ResponseEntity<>(
                new Message("Login exitoso", user),
                HttpStatus.OK);
    }

    /**
     * Login QR - Solo para usuarios que no requieren contraseña
     * (Este método se mantiene para compatibilidad, pero el login QR real
     * para pacientes debe usar AuthController)
     */
    @Deprecated
    public ResponseEntity<Message> loginQr(UserDto dto) {
        User user = repository.findByUsername(dto.getUsername());

        if (user == null) {
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, true),
                    HttpStatus.UNAUTHORIZED);
        }

        // QR Login bypassa validación de contraseña
        // pero debe usarse solo para usuarios sin autenticación requerida
        if (Boolean.TRUE.equals(user.getNeedAuthentication())) {
            return new ResponseEntity<>(
                    new Message("Este usuario requiere contraseña", null, true),
                    HttpStatus.FORBIDDEN);
        }

        return new ResponseEntity<>(
                new Message("Login exitoso", user),
                HttpStatus.OK);
    }
}