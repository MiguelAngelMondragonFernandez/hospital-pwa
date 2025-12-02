package com.example.demo.Attention;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Dto {

    private Long id;
    private String dateTime;
    private String status;
    private Long stretcherId;
    private Long nurseId;

}
