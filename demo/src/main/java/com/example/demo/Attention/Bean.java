package com.example.demo.Attention;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;

@Table(name = "attention")
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Bean {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_time")
    private String dateTime;

    @Column(name = "status")
    private String status;

    @Column(name = "stretcher_id")
    private Long stretcherId;

}
