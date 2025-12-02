package com.example.demo.Nurse;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Table(name = "nurse_assignments")
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NurseAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nurse_id")
    private Long nurseId;

    @Column(name = "stretcher_id")
    private Long stretcherId;
}
