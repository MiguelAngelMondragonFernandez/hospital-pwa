package com.example.demo.Patient.Entity;

import com.example.demo.Bed.Entity.Bed;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "patients")
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 150)
    private String nombre;

    @Column(name = "last_name", nullable = false, length = 150)
    private String apellidos;

    @Column(name = "blood_type", length = 10)
    private String tipoSangre;

    @Column(name = "ailments", columnDefinition = "TEXT")
    private String padecimientos;

    @Column(name = "description", columnDefinition = "TEXT")
    private String descripcion;

    @Column(unique = true, nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "ENUM('activo','inactivo','alta')", nullable = false)
    private EstatusPaciente estatus;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"paciente", "hibernateLazyInitializer", "handler"})
    private Bed cama;

    @Column(name = "admission_date")
    private LocalDateTime fechaIngreso;

    @Column(name = "discharge_date")
    private LocalDateTime fechaSalida;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EstatusPaciente {
        activo,
        inactivo,
        alta
    }
}