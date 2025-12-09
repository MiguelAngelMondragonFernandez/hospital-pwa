package com.example.demo.Nurse;

import com.example.demo.Bed.Entity.Bed;
import com.example.demo.User.Entity.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "nurse_assignments")
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NurseAssignment {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        // Relación con el enfermero (User con rol "nurse")
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "nurse_id", nullable = false)
        @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
        private User nurse;

        // Relación con la cama
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "bed_id", nullable = false)
        @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "paciente"})
        private Bed bed;

        // Campo para indicar si el turno está abierto
        @Column(name = "shift_open", nullable = false)
        private Boolean shiftOpen = true;

        // Fecha y hora de inicio del turno
        @Column(name = "shift_start")
        private LocalDateTime shiftStart;

        // Fecha y hora de cierre del turno
        @Column(name = "shift_end")
        private LocalDateTime shiftEnd;

        @Column(name = "created_at")
        private LocalDateTime createdAt;

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @PrePersist
        protected void onCreate() {
                createdAt = LocalDateTime.now();
                updatedAt = LocalDateTime.now();
                if (shiftOpen == null) {
                        shiftOpen = true;
                }
                if (shiftStart == null) {
                        shiftStart = LocalDateTime.now();
                }
        }

        @PreUpdate
        protected void onUpdate() {
                updatedAt = LocalDateTime.now();
        }
}