package com.example.demo.Nurse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActiveAssignmentDTO {
    // Información de la asignación
    private Long assignmentId;
    private Boolean shiftOpen;
    private LocalDateTime shiftStart;
    private LocalDateTime shiftEnd;

    // Información del enfermero
    private Long nurseId;
    private String nurseName;

    // Información de la cama
    private Long bedId;
    private String bedStatus;

    // Información del paciente (puede ser null si no hay paciente asignado)
    private Long patientId;
    private String patientName;
    private String patientBloodType;
    private String patientAilments;
    private String patientDescription;
    private LocalDateTime patientAdmissionDate;

}

