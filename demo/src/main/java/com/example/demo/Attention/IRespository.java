package com.example.demo.Attention;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IRespository extends JpaRepository<Bean, Long> {

    List<Bean> findAllByStatusNot(String status);

    List<Bean> findAllByStretcherId(Long stretcherId);

}
