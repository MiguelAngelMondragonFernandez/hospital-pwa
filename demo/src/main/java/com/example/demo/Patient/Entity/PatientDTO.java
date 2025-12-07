package com.example.demo.Patient.Entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PatientDTO {

    private Long id;
    private String nombre;
    private String apellido;
    private String tipoSangre;
    private String padecimientos;
    private String descripcion;
    private String estatus;
    private Long camaId;
    private String camaStatus;
    private LocalDateTime fechaIngreso;
    private LocalDateTime fechaSalida;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}