package com.example.demo.Nurse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NurseAssignmentRepository extends JpaRepository<NurseAssignment, Long> {

    // Verificar si ya existe una asignación activa entre enfermero y cama
    @Query("SELECT COUNT(na) > 0 FROM NurseAssignment na WHERE na.nurse.id = :nurseId AND na.bed.id = :bedId AND na.shiftOpen = true")
    boolean existsActiveAssignmentByNurseIdAndBedId(Long nurseId, Long bedId);

    // Obtener todas las asignaciones de un enfermero
    @Query("SELECT na FROM NurseAssignment na WHERE na.nurse.id = :nurseId")
    List<NurseAssignment> findAllByNurseId(Long nurseId);

    // Obtener solo las asignaciones activas (turno abierto) de un enfermero
    @Query("SELECT na FROM NurseAssignment na WHERE na.nurse.id = :nurseId AND na.shiftOpen = true")
    List<NurseAssignment> findActiveAssignmentsByNurseId(Long nurseId);

    // Obtener todas las asignaciones de una cama
    @Query("SELECT na FROM NurseAssignment na WHERE na.bed.id = :bedId")
    List<NurseAssignment> findAllByBedId(Long bedId);

    // Obtener las asignaciones activas de una cama
    @Query("SELECT na FROM NurseAssignment na WHERE na.bed.id = :bedId AND na.shiftOpen = true")
    List<NurseAssignment> findActiveAssignmentsByBedId(Long bedId);

    // Buscar una asignación específica activa
    @Query("SELECT na FROM NurseAssignment na WHERE na.nurse.id = :nurseId AND na.bed.id = :bedId AND na.shiftOpen = true")
    Optional<NurseAssignment> findActiveAssignment(Long nurseId, Long bedId);

    // Obtener todas las asignaciones activas
    @Query("SELECT na FROM NurseAssignment na WHERE na.shiftOpen = true")
    List<NurseAssignment> findAllActiveAssignments();
}