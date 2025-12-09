package com.example.demo.User.Service;

import com.example.demo.Bed.Entity.Bed;
import com.example.demo.Bed.Entity.BedRepository;
import com.example.demo.Patient.Entity.Patient;
import com.example.demo.Patient.Entity.PatientRepository;
import com.example.demo.utils.Message;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Data
@NoArgsConstructor
public class QrAuthService {

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private PatientRepository patientRepository;

    // Clave secreta para firmar el JWT (en producción debe estar en variables de entorno)
    @Value("${jwt.secret:mySecretKeyForJWTTokenGenerationThatIsVeryLongAndSecure123456}")
    private String jwtSecret;

    // Tiempo de expiración del token en milisegundos (12 horas)
    private static final long JWT_EXPIRATION = 12 * 60 * 60 * 1000;

    /**
     * Login mediante QR - Genera JWT para paciente
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Message> loginViaQr(Long bedId) {

        // 1. Verificar que la cama existe
        Optional<Bed> bedOptional = bedRepository.findById(bedId);
        if (!bedOptional.isPresent()) {
            return new ResponseEntity<>(
                    new Message("La cama no existe", null, true),
                    HttpStatus.NOT_FOUND
            );
        }

        Bed bed = bedOptional.get();

        // 2. Verificar que la cama tiene un paciente asignado
        if (bed.getPaciente() == null) {
            return new ResponseEntity<>(
                    new Message("Esta cama no tiene un paciente asignado", null, true),
                    HttpStatus.BAD_REQUEST
            );
        }

        Patient patient = bed.getPaciente();

        // 3. Verificar que el paciente está activo (no dado de alta)
        if (patient.getEstatus() != Patient.EstatusPaciente.activo) {
            String mensaje = patient.getEstatus() == Patient.EstatusPaciente.alta
                    ? "El paciente ya fue dado de alta"
                    : "El paciente no está activo";
            return new ResponseEntity<>(
                    new Message(mensaje, null, true),
                    HttpStatus.FORBIDDEN
            );
        }

        // 4. Generar el JWT
        String token = generateToken(patient.getId(), bedId, "PATIENT");

        // 5. Preparar respuesta
        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken(token);
        authResponse.setPatientId(patient.getId());
        authResponse.setPatientName(patient.getNombre() + " " + patient.getApellidos());
        authResponse.setBloodType(patient.getTipoSangre());
        authResponse.setBedId(bedId);
        authResponse.setBedStatus(bed.getStatus().name());
        authResponse.setRole("PATIENT");

        return new ResponseEntity<>(
                new Message("Login exitoso", authResponse),
                HttpStatus.OK
        );
    }

    /**
     * Genera un token JWT
     */
    private String generateToken(Long patientId, Long bedId, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION);

        Map<String, Object> claims = new HashMap<>();
        claims.put("patientId", patientId);
        claims.put("bedId", bedId);
        claims.put("role", role);
        claims.put("type", "qr-login");

        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(patientId.toString())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * DTO para la respuesta de autenticación
     */
    @Data
    @NoArgsConstructor
    public static class AuthResponse {
        private String token;
        private Long patientId;
        private String patientName;
        private String bloodType;
        private Long bedId;
        private String bedStatus;
        private String role;
    }
}