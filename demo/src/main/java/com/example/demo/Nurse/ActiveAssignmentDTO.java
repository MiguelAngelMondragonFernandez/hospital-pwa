package com.example.demo.Nurse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActiveAssignmentDTO {
    private Long assignmentId;
    private Boolean shiftOpen;
    private LocalDateTime shiftStart;
    private LocalDateTime shiftEnd;
    private Long nurseId;
    private Long bedId;
    private String bedStatus;
    private Long patientId;
    private String patientName;
    private String patientBloodType;
    private String patientAilments;
    private String patientDescription;
    private LocalDateTime patientAdmissionDate;
}