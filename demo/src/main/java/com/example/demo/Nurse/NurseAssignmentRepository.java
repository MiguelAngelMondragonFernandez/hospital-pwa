package com.example.demo.Nurse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param; // Importante agregar esto
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NurseAssignmentRepository extends JpaRepository<NurseAssignment, Long> {

    // Verificar si ya existe una asignación activa entre enfermero y cama
    @Query("SELECT COUNT(na) > 0 FROM NurseAssignment na WHERE na.nurse.id = :nurseId AND na.bed.id = :bedId AND na.shiftOpen = true")
    boolean existsActiveAssignmentByNurseIdAndBedId(@Param("nurseId") Long nurseId, @Param("bedId") Long bedId);

    // Obtener todas las asignaciones de un enfermero
    @Query("SELECT na FROM NurseAssignment na WHERE na.nurse.id = :nurseId")
    List<NurseAssignment> findAllByNurseId(@Param("nurseId") Long nurseId);


    @Query("SELECT na FROM NurseAssignment na " +
            "JOIN FETCH na.bed b " +           // Traemos la cama
            "LEFT JOIN FETCH b.paciente p " +  
            "WHERE na.nurse.id = :nurseId AND na.shiftOpen = true")
    List<NurseAssignment> findActiveAssignmentsByNurseId(@Param("nurseId") Long nurseId);

    // Obtener todas las asignaciones de una cama
    @Query("SELECT na FROM NurseAssignment na WHERE na.bed.id = :bedId")
    List<NurseAssignment> findAllByBedId(@Param("bedId") Long bedId);

    // Obtener las asignaciones activas de una cama
    @Query("SELECT na FROM NurseAssignment na WHERE na.bed.id = :bedId AND na.shiftOpen = true")
    List<NurseAssignment> findActiveAssignmentsByBedId(@Param("bedId") Long bedId);

    // Buscar una asignación específica activa
    @Query("SELECT na FROM NurseAssignment na WHERE na.nurse.id = :nurseId AND na.bed.id = :bedId AND na.shiftOpen = true")
    Optional<NurseAssignment> findActiveAssignment(@Param("nurseId") Long nurseId, @Param("bedId") Long bedId);

    // Obtener todas las asignaciones activas
    @Query("SELECT na FROM NurseAssignment na WHERE na.shiftOpen = true")
    List<NurseAssignment> findAllActiveAssignments();
}