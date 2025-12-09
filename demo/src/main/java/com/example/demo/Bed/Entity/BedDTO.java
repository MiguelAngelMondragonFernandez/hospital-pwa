package com.example.demo.Bed.Entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BedDTO {

    private Long id;
    private String status;
    private LocalDateTime assignDate;
    private LocalDateTime releaseDate;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;

}
