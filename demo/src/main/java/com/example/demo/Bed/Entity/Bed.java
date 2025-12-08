package com.example.demo.Bed.Entity;

import com.example.demo.Nurse.NurseAssignment;
import com.example.demo.Patient.Entity.Patient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Table(name = "beds")
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "ENUM('libre','ocupada','limpieza','mantenimiento')", nullable = false)
    private BedStatus status;

    @Column(name = "assign_date")
    private LocalDateTime assignDate;

    @Column(name = "release_date")
    private LocalDateTime releaseDate;

    // URL del código QR
    @Column(name = "qr_url", length = 500)
    private String qrUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relación One-to-One con Patient
    @OneToOne(mappedBy = "cama", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"cama", "hibernateLazyInitializer", "handler"})
    private Patient paciente;

    // Relación One-to-Many con NurseAssignment
    @OneToMany(mappedBy = "bed", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"bed", "hibernateLazyInitializer", "handler"})
    private List<NurseAssignment> nurseAssignments;

    public enum BedStatus {
        libre,
        ocupada,
        limpieza,
        mantenimiento
    }
}