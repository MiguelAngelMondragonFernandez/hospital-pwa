package com.example.demo.Nurse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NurseAssignmentRepository extends JpaRepository<NurseAssignment, Long> {
    List<NurseAssignment> findAllByNurseId(Long nurseId);

    boolean existsByNurseIdAndStretcherId(Long nurseId, Long stretcherId);
}
